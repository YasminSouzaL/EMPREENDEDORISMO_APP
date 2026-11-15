package com.ex.grupoempr.empreendedorismo.learning;

import com.ex.grupoempr.empreendedorismo.portal.PortalAuthService;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import static com.ex.grupoempr.empreendedorismo.learning.DocumentService.*;

@RestController
public class TeachingController {
    private final PortalAuthService auth;
    private final DocumentService documents;
    private final ExtraService extras;
    private final JdbcTemplate db;
    private final JsonMapper mapper=JsonMapper.builder().build();
    public TeachingController(PortalAuthService auth,DocumentService documents,ExtraService extras,JdbcTemplate db) { this.auth=auth;this.documents=documents;this.extras=extras;this.db=db; }
    public static final Map<String,String> COURSES=Map.of("matematica","Matemática","portugues","Português","ciencias","Ciências","historia","História","geografia","Geografia","fisica","Física","quimica","Química","biologia","Biologia");
    private List<Map<String,Object>> schoolContents(String school) { return db.queryForList("select id,course_id as \"courseId\",class_id as \"classId\",title,body,url from portal_content where school_id=? order by created_at desc",school); }
    @GetMapping("/teaching/contents")
    public List<Map<String,Object>> contents(@RequestHeader(value="Authorization",required=false) String token) { var actor=auth.require(token);requireTeacher(actor);return schoolContents(actor.schoolId()).stream().filter(c->documents.allowed(actor,string(c,"courseId"),string(c,"classId"))).toList(); }
    @PostMapping("/teaching/contents") @ResponseStatus(HttpStatus.CREATED) @Transactional
    public Map<String,Object> createContent(@RequestHeader(value="Authorization",required=false) String token,@RequestBody Map<String,Object> input) { return saveContent(auth.require(token),UUID.randomUUID().toString(),input,false); }
    @PatchMapping("/teaching/contents/{id}") @Transactional
    public Map<String,Object> editContent(@RequestHeader(value="Authorization",required=false) String token,@PathVariable String id,@RequestBody Map<String,Object> input) { return saveContent(auth.require(token),id,input,true); }
    private Map<String,Object> existing(PortalAuthService.Actor actor,String id) { return schoolContents(actor.schoolId()).stream().filter(c->id.equals(c.get("id"))).findFirst().orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND)); }
    private Map<String,Object> saveContent(PortalAuthService.Actor actor,String id,Map<String,Object> input,boolean edit) {
        requireTeacher(actor);Map<String,Object> data=new LinkedHashMap<>();if(edit) { data.putAll(existing(actor,id));auth.authorizeClass(actor,string(data,"courseId"),string(data,"classId")); } data.putAll(input);
        for(String key:List.of("courseId","classId","title","body")) if(string(data,key).isBlank() || string(data,key).length()>(key.equals("body")?50000:200)) bad("Preencha o campo "+key+".");
        auth.authorizeClass(actor,string(data,"courseId"),string(data,"classId"));String url=string(data,"url");if(!url.isBlank() && (!url.matches("https?://[^\\s]+") || url.length()>2000)) bad("Informe um endereço HTTP válido.");
        if(edit) db.update("update portal_content set course_id=?,class_id=?,title=?,body=?,url=? where id=? and school_id=?",data.get("courseId"),data.get("classId"),data.get("title"),data.get("body"),url,id,actor.schoolId());
        else db.update("insert into portal_content(id,school_id,course_id,class_id,title,body,url,created_at) values(?,?,?,?,?,?,?,?)",id,actor.schoolId(),data.get("courseId"),data.get("classId"),data.get("title"),data.get("body"),url,Timestamp.from(Instant.now()));
        return existing(actor,id);
    }
    @DeleteMapping("/teaching/contents/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @Transactional
    public void deleteContent(@RequestHeader(value="Authorization",required=false) String token,@PathVariable String id) { var actor=auth.require(token);requireTeacher(actor);var old=existing(actor,id);auth.authorizeClass(actor,string(old,"courseId"),string(old,"classId"));db.update("delete from portal_content where id=? and school_id=?",id,actor.schoolId()); }
    @GetMapping("/student/courses")
    public List<Map<String,Object>> courses(@RequestHeader(value="Authorization",required=false) String token) {
        var actor=auth.require(token);if(!actor.role().equals("student")) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        var labels=db.queryForList("select a.turma from aluno a join portal_member_student ms on a.id=ms.student_id where ms.member_id=? and a.school_id=?",String.class,actor.id(),actor.schoolId());
        var visible=schoolContents(actor.schoolId()).stream().filter(c->labels.stream().anyMatch(label->matchesClass(label,string(c,"classId")))).toList();
        return COURSES.entrySet().stream().filter(c->!Set.of("fisica","quimica","biologia").contains(c.getKey()) || labels.stream().anyMatch(l->l.contains("série"))).sorted(Map.Entry.comparingByValue()).map(c->{Map<String,Object> out=new LinkedHashMap<>();out.put("id",c.getKey());out.put("name",c.getValue());out.put("description","Explore os conteúdos e as missões da sua turma.");out.put("contents",visible.stream().filter(item->c.getKey().equals(item.get("courseId"))).toList());return out;}).toList();
    }
    @PatchMapping("/teaching/activities/{id}") @Transactional
    public Map<String,Object> editActivity(@RequestHeader(value="Authorization",required=false) String token,@PathVariable String id,@RequestBody Map<String,Object> input) {
        var actor=auth.require(token);requireTeacher(actor);var row=extras.owned(actor,id,false);
        var payload=extras.parse((String)row.get("payload"));String title=input.containsKey("title")?string(input,"title").trim():string(payload,"title");
        if(title.isBlank() || title.length()>200) bad("Informe um título com até 200 caracteres.");
        Instant due=((Timestamp)row.get("due_at")).toInstant();if(input.containsKey("dueAt")) {try {due=Instant.parse(string(input,"dueAt"));}catch(RuntimeException error) {bad("Prazo inválido.");}if(!due.isAfter(Instant.now())) bad("O prazo precisa estar no futuro.");}
        payload.put("title",title);db.update("update portal_extra set payload=?,due_at=? where id=? and school_id=?",mapper.writeValueAsString(payload),Timestamp.from(due),id,actor.schoolId());return extras.row(db.queryForMap("select * from portal_extra where id=?",id));
    }
    @DeleteMapping("/teaching/activities/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @Transactional
    public void archiveActivity(@RequestHeader(value="Authorization",required=false) String token,@PathVariable String id) {
        var actor=auth.require(token);requireTeacher(actor);extras.owned(actor,id,false);
        // Preserva as respostas e as evidências pedagógicas quando o professor encerra a atividade.
        db.update("update portal_extra set status='archived' where id=? and school_id=?",id,actor.schoolId());
    }
    @PostMapping("/teaching/activities") @ResponseStatus(HttpStatus.CREATED) @Transactional
    public List<Map<String,Object>> publish(@RequestHeader(value="Authorization",required=false) String token,@RequestBody Map<String,Object> body) {
        var actor=auth.require(token);requireTeacher(actor);String course=string(body,"courseId"),classId=string(body,"classId"),title=string(body,"title"),type=string(body,"type");auth.authorizeClass(actor,course,classId);
        if(title.isBlank() || title.length()>200 || !Set.of("activity","simulation").contains(type)) bad("Informe título e tipo da atividade.");
        if(!(body.get("questionIds") instanceof List<?> requested) || requested.isEmpty() || requested.size()>100) bad("Escolha de 1 a 100 questões aprovadas.");
        List<?> requested=(List<?>)body.get("questionIds");if(new HashSet<>(requested).size()!=requested.size()) bad("Questões duplicadas.");
        var learning=documents.full(actor.schoolId(),"learning");var questions=items(learning,"questions").stream().filter(q->requested.contains(q.get("id")) && course.equals(q.get("courseId")) && "approved".equals(q.get("status"))).toList();if(questions.size()!=requested.size()) bad("Todas as questões precisam estar aprovadas na disciplina selecionada.");
        List<Long> recipients=db.queryForList("select id from aluno where school_id=?",Long.class,actor.schoolId()).stream().filter(id->{String label=db.queryForObject("select turma from aluno where id=?",String.class,id);return matchesClass(label,classId);}).toList();
        if(body.get("studentIds") instanceof List<?> selected) { var selectedIds=selected.stream().map(DocumentService::asId).toList();if(!recipients.containsAll(selectedIds)) bad("Aluno fora da turma selecionada.");recipients=recipients.stream().filter(selectedIds::contains).toList(); }
        if(recipients.isEmpty()) bad("A turma não possui alunos selecionados.");
        Instant due=Instant.now().plus(7,ChronoUnit.DAYS);if(body.containsKey("dueAt")) {try {due=Instant.parse(string(body,"dueAt"));} catch(RuntimeException e) {bad("Prazo inválido.");} }if(!due.isAfter(Instant.now())) bad("O prazo precisa estar no futuro.");
        List<Map<String,Object>> assignments=new ArrayList<>();for(Long student:recipients) {String id=UUID.randomUUID().toString();Map<String,Object> payload=new LinkedHashMap<>();payload.put("title",title);payload.put("type",type);payload.put("courseName",COURSES.getOrDefault(course,course));payload.put("studentId",student);payload.put("courseId",course);payload.put("classId",classId);payload.put("questionIds",requested);payload.put("questions",questions);payload.put("bonusPoints",0);payload.put("selectionBasis","Atividade publicada pelo professor para sua turma.");db.update("insert into portal_extra(id,school_id,student_id,policy_id,course_id,class_id,status,created_at,due_at,payload) values(?,?,?,?,?,?,?,?,?,?)",id,actor.schoolId(),student,"teacher",course,classId,"published",Timestamp.from(Instant.now()),Timestamp.from(due),mapper.writeValueAsString(payload));assignments.add(extras.row(db.queryForMap("select * from portal_extra where id=?",id)));}return assignments;
    }
}
