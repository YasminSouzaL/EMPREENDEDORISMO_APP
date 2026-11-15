package com.ex.grupoempr.empreendedorismo.learning;

import com.ex.grupoempr.empreendedorismo.portal.PortalAuthService;
import com.ex.grupoempr.empreendedorismo.portal.PortalAuthService.Actor;
import com.ex.grupoempr.empreendedorismo.repository.AlunoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;
import java.util.*;

@Service
public class DocumentService {
    private final JdbcTemplate jdbc;
    private final PortalAuthService auth;
    private final AlunoRepository students;
    private final JsonMapper mapper = JsonMapper.builder().build();
    public DocumentService(JdbcTemplate jdbc, PortalAuthService auth, AlunoRepository students) {
        this.jdbc = jdbc; this.auth = auth; this.students = students;
    }
    public static List<String> keys(String domain) {
        return domain.equals("learning") ? List.of("questions", "results", "observations") : List.of("groups", "policies", "rewards", "awards", "rounds");
    }
    @SuppressWarnings("unchecked")
    public Map<String,Object> full(String schoolId, String domain) {
        List<Map<String,Object>> rows = jdbc.query("select revision,payload from portal_documents where school_id=? and domain=?", (rs,n) -> {
            Map<String,Object> data = mapper.readValue(rs.getString("payload"), Map.class);
            data.put("revision", rs.getLong("revision")); return data;
        }, schoolId, domain);
        if (!rows.isEmpty()) return rows.get(0);
        Map<String,Object> empty = new LinkedHashMap<>();
        for (String key : keys(domain)) empty.put(key, new ArrayList<>());
        empty.put("revision", 0L); return empty;
    }
    public Map<String,Object> read(Actor actor, String domain) {
        requireTeacher(actor);
        return visible(actor, domain, full(actor.schoolId(), domain));
    }
    public static void requireTeacher(Actor actor) {
        if (!Set.of("admin","director","teacher").contains(actor.role())) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }
    public boolean allowed(Actor actor, String courseId, String classId) {
        if (courseId == null || courseId.isBlank()) return false;
        try { auth.authorizeClass(actor, courseId, classId); return true; }
        catch (ResponseStatusException error) { return false; }
    }
    private boolean courseAllowed(Actor actor, String courseId) {
        return !courseId.isBlank() && (!actor.role().equals("teacher") || actor.courseIds().contains(courseId) || actor.classIds().stream().anyMatch(id -> id.startsWith(courseId + "-")));
    }
    public boolean itemAllowed(Actor actor, String key, Map<String,Object> item, Map<String,Object> data) {
        if (key.equals("rewards")) return true;
        if (key.equals("questions")) return courseAllowed(actor, string(item,"courseId"));
        if (key.equals("awards")) return items(data,"rounds").stream().anyMatch(round -> string(round,"id").equals(string(item,"roundId")) && allowed(actor,string(round,"courseId"),string(round,"classId")));
        return allowed(actor,string(item,"courseId"),string(item,"classId"));
    }
    private Map<String,Object> visible(Actor actor, String domain, Map<String,Object> data) {
        Map<String,Object> result = new LinkedHashMap<>(); result.put("revision",data.get("revision"));
        for (String key : keys(domain)) result.put(key, items(data,key).stream().filter(item -> itemAllowed(actor,key,item,data)).toList());
        return result;
    }
    @Transactional
    public Map<String,Object> save(Actor actor, String domain, Map<String,Object> input) {
        requireTeacher(actor);
        jdbc.queryForObject("select id from portal_school where id=? for update",String.class,actor.schoolId());
        Map<String,Object> previous = full(actor.schoolId(),domain);
        long revision = ((Number)previous.get("revision")).longValue();
        if (!(input.get("revision") instanceof Number value) || value.longValue()!=revision) throw new ResponseStatusException(HttpStatus.CONFLICT,"Os registros mudaram. Recarregue a página.");
        Map<String,Object> merged = new LinkedHashMap<>(previous);
        for (String key : keys(domain)) {
            List<Map<String,Object>> incoming = items(input,key);
            if (incoming.size()>10000) bad("Limite de registros excedido.");
            Map<String,Map<String,Object>> rows = new LinkedHashMap<>();
            for (Map<String,Object> row : items(previous,key)) if (!itemAllowed(actor,key,row,previous)) rows.put(string(row,"id"),row);
            Map<String,Map<String,Object>> previousRows = new HashMap<>();
            for (Map<String,Object> row : items(previous,key)) previousRows.put(string(row,"id"),row);
            Set<String> seen = new HashSet<>();
            for (Map<String,Object> row : incoming) {
                String id = string(row,"id");
                if (id.isBlank() || id.length()>128 || !seen.add(id)) bad("Identificador inválido ou duplicado.");
                Map<String,Object> old = previousRows.get(id);
                if (domain.equals("learning") && key.equals("questions") && old!=null && !old.equals(row)) {
                    for(String payload:jdbc.queryForList("select payload from portal_extra where school_id=?",String.class,actor.schoolId())) {
                        Map<String,Object> assignment=mapper.readValue(payload,Map.class);
                        if(((List<?>)assignment.getOrDefault("questionIds",List.of())).contains(id)) bad("Questão já enviada em atividade. Crie uma nova versão.");
                    }
                }
                if (!itemAllowed(actor,key,row,input) || (old!=null && !itemAllowed(actor,key,old,previous))) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
                if (old!=null && (!Objects.equals(old.get("courseId"),row.get("courseId")) || !Objects.equals(old.get("classId"),row.get("classId")))) bad("O vínculo de um registro não pode ser alterado.");
                verifyStudents(actor,key,row);
                rows.put(id,new LinkedHashMap<>(row));
            }
            merged.put(key,new ArrayList<>(rows.values()));
        }
        if (domain.equals("learning")) {
            Set<String> retained = new HashSet<>();for(var question:items(merged,"questions")) retained.add(string(question,"id"));
            for(String saved:jdbc.queryForList("select payload from portal_extra where school_id=?",String.class,actor.schoolId())) {
                Map<String,Object> assignment=mapper.readValue(saved,Map.class);
                for(Object question:(List<?>)assignment.getOrDefault("questionIds",List.of())) if(!retained.contains(String.valueOf(question))) bad("Questão já enviada não pode ser excluída.");
            }
            LearningDomainValidator.validate(merged,previous);
        }
        else GamificationValidator.validate(merged,previous);
        String payload = mapper.writeValueAsString(merged);
        if (payload.length()>5_000_000) bad("O conjunto excedeu o limite de tamanho.");
        if (revision==0) {
            try { jdbc.update("insert into portal_documents(school_id,domain,revision,payload) values(?,?,1,?)",actor.schoolId(),domain,payload); }
            catch (org.springframework.dao.DuplicateKeyException error) { throw new ResponseStatusException(HttpStatus.CONFLICT,"Recarregue os registros."); }
        } else if (jdbc.update("update portal_documents set revision=revision+1,payload=? where school_id=? and domain=? and revision=?",payload,actor.schoolId(),domain,revision)!=1) throw new ResponseStatusException(HttpStatus.CONFLICT);
        merged.put("revision",revision+1);
        return visible(actor,domain,merged);
    }
    private void verifyStudents(Actor actor,String key,Map<String,Object> row) {
        Set<Long> ids = new HashSet<>();
        if (row.get("studentId") instanceof Number number) ids.add(number.longValue());
        if (row.get("studentIds") instanceof List<?> list) for(Object id:list) ids.add(asId(id));
        if (key.equals("rounds")) {
            for (Map<String,Object> group: items(row,"groups")) for(Object id:(List<?>)group.getOrDefault("studentIds",List.of())) ids.add(asId(id));
            for (Map<String,Object> result: items(row,"results")) ids.add(asId(result.get("studentId")));
        }
        for (Long id:ids) {
            var student = students.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,"Aluno inválido."));
            if (!auth.canReadStudent(actor,student)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            String classId=string(row,"classId");
            if (!classId.isBlank() && !matchesClass(student.getTurma(),classId)) bad("O aluno não pertence à turma selecionada.");
        }
    }
    public static boolean matchesClass(String label,String classId) {
        if (label.equals(classId)) return true;
        String[] parts=classId.split("-");
        if(parts.length<3) return false;
        try {
            int index=Integer.parseInt(parts[parts.length-2]);
            String grade=index<=4 ? (index+5)+" ano" : index<=7 ? (index-4)+" serie" : (index-7)+" ano";
            return normalize(label).equals(grade+" "+parts[parts.length-1].toLowerCase(Locale.ROOT));
        } catch(NumberFormatException error) { return false; }
    }
    private static String normalize(String value) { return java.text.Normalizer.normalize(value,java.text.Normalizer.Form.NFD).replaceAll("\\p{M}","").replaceAll("[ºª°]","").trim().replaceAll("\\s+"," ").toLowerCase(Locale.ROOT); }
    public static long asId(Object value) {
        if (!(value instanceof Number number) || number.doubleValue()!=number.longValue() || number.longValue()<1) { bad("Aluno inválido."); return 0; }
        return number.longValue();
    }
    public static String string(Map<String,Object> value,String key) { return value.get(key) instanceof String text ? text : ""; }
    @SuppressWarnings("unchecked")
    public static List<Map<String,Object>> items(Map<String,Object> value,String key) {
        if (!(value.get(key) instanceof List<?> list) || list.stream().anyMatch(item -> !(item instanceof Map))) { bad("Lista inválida: "+key); return List.of(); }
        return (List<Map<String,Object>>)(List<?>)list;
    }
    public static void bad(String message) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST,message); }
}
