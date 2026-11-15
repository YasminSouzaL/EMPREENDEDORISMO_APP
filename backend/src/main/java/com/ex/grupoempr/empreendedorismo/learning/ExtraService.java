package com.ex.grupoempr.empreendedorismo.learning;

import com.ex.grupoempr.empreendedorismo.portal.PortalAuthService;
import com.ex.grupoempr.empreendedorismo.portal.PortalAuthService.Actor;
import com.ex.grupoempr.empreendedorismo.repository.AlunoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import static com.ex.grupoempr.empreendedorismo.learning.DocumentService.*;

@Service
public class ExtraService {
    private final JdbcTemplate db;
    private final DocumentService documents;
    private final PortalAuthService auth;
    private final AlunoRepository students;
    private final JsonMapper mapper=JsonMapper.builder().build();
    public ExtraService(JdbcTemplate db,DocumentService documents,PortalAuthService auth,AlunoRepository students) { this.db=db; this.documents=documents; this.auth=auth; this.students=students; }
    @SuppressWarnings("unchecked")
    Map<String,Object> parse(String value) { return mapper.readValue(value,Map.class); }
    Map<String,Object> row(Map<String,Object> value) {
        var payload=parse((String)value.get("payload"));
        payload.put("id",value.get("id")); payload.put("status",value.get("status"));
        payload.put("dueAt",((Timestamp)value.get("due_at")).toInstant().toString());
        if(value.get("completed_at") instanceof Timestamp date) payload.put("completedAt",date.toInstant().toString());
        payload.remove("questions"); return payload;
    }
    public List<Map<String,Object>> list(Actor actor) {
        requireTeacher(actor);
        return db.queryForList("select * from portal_extra where school_id=? order by created_at desc",actor.schoolId()).stream()
            .filter(item->documents.allowed(actor,(String)item.get("course_id"),(String)item.get("class_id"))).map(this::row).toList();
    }
    @Transactional
    public Map<String,Object> generate(Actor actor,String policyId,long studentId) {
        requireTeacher(actor);
        var policy=items(documents.full(actor.schoolId(),"gamification"),"policies").stream().filter(p->string(p,"id").equals(policyId)).findFirst().orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));
        auth.authorizeClass(actor,string(policy,"courseId"),string(policy,"classId"));
        return create(actor.schoolId(),policy,studentId);
    }
    @Transactional
    public Map<String,Object> create(String schoolId,Map<String,Object> policy,long studentId) {
        // Serializa a geração para evitar duplicações entre o agendador e a tela.
        db.queryForObject("select id from portal_school where id=? for update",String.class,schoolId);
        var student=students.findById(studentId).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));
        if(!schoolId.equals(student.getSchoolId()) || !matchesClass(student.getTurma(),string(policy,"classId"))) bad("Aluno fora da turma da política.");
        var recent=db.queryForList("select * from portal_extra where school_id=? and policy_id=? and student_id=? order by created_at desc",schoolId,string(policy,"id"),studentId);
        int period=((Number)policy.get("periodDays")).intValue();
        if(!recent.isEmpty() && ((Timestamp)recent.get(0).get("created_at")).toInstant().isAfter(Instant.now().minus(period,ChronoUnit.DAYS))) return row(recent.get(0));
        var learning=documents.full(schoolId,"learning");
        Map<String,long[]> skillStats=new HashMap<>(); Set<String> answered=new HashSet<>();
        for(var result:items(learning,"results")) if(asId(result.get("studentId"))==studentId && string(result,"courseId").equals(string(policy,"courseId"))) {
            long[] stats=skillStats.computeIfAbsent(string(result,"skill"),ignored->new long[2]);
            stats[0]+=((Number)result.get("correctAnswers")).longValue(); stats[1]+=((Number)result.get("totalQuestions")).longValue();
            answered.add(string(result,"questionId"));
        }
        Set<String> difficult=new HashSet<>(); skillStats.forEach((skill,stats)->{if(stats[1]>=3 && (double)stats[0]/stats[1]<.6) difficult.add(skill);});
        List<Map<String,Object>> available=items(learning,"questions").stream().filter(q->string(q,"courseId").equals(string(policy,"courseId")) && string(q,"status").equals("approved")).toList();
        Set<String> prerequisites=new HashSet<>();
        for(var question:available) if(difficult.contains(string(question,"skill"))) for(Object prerequisite:(List<?>)question.getOrDefault("prerequisites",List.of())) prerequisites.add(String.valueOf(prerequisite));
        var selected=available.stream().sorted(Comparator.<Map<String,Object>>comparingInt(q->difficult.contains(string(q,"skill")) ? 0 : prerequisites.contains(string(q,"skill")) || prerequisites.contains(string(q,"content")) ? 1 : 2).thenComparingInt(q->answered.contains(string(q,"id"))?1:0).thenComparing(q->string(q,"id")))
            .limit(((Number)policy.get("questionCount")).intValue()).toList();
        if(selected.size()<((Number)policy.get("questionCount")).intValue()) bad("Banco aprovado insuficiente para a quantidade solicitada.");
        String id=UUID.randomUUID().toString();
        Map<String,Object> payload=new LinkedHashMap<>();
        payload.put("studentId",studentId); payload.put("policyId",string(policy,"id")); payload.put("courseId",string(policy,"courseId")); payload.put("classId",string(policy,"classId"));
        payload.put("title","Missão de reforço"); payload.put("type","extra");
        payload.put("questionIds",selected.stream().map(q->string(q,"id")).toList()); payload.put("questions",selected); payload.put("bonusPoints",policy.get("bonusPoints"));
        payload.put("selectionBasis",difficult.isEmpty()?"Sem evidência suficiente de dificuldade; prática geral.":"Prioridade por habilidades com menos de 60% de acerto em pelo menos 3 respostas e seus pré-requisitos.");
        Instant now=Instant.now(), due=now.plus(((Number)policy.get("deadlineDays")).intValue(),ChronoUnit.DAYS);
        db.update("insert into portal_extra(id,school_id,student_id,policy_id,course_id,class_id,status,created_at,due_at,payload) values(?,?,?,?,?,?,?,?,?,?)",id,schoolId,studentId,string(policy,"id"),string(policy,"courseId"),string(policy,"classId"),string(policy,"approvalMode").equals("automatic")?"published":"pending_approval",Timestamp.from(now),Timestamp.from(due),mapper.writeValueAsString(payload));
        return row(db.queryForMap("select * from portal_extra where id=?",id));
    }
    @Transactional
    public Map<String,Object> approve(Actor actor,String id) {
        requireTeacher(actor); var row=owned(actor,id,false);
        if(((Timestamp)row.get("due_at")).toInstant().isBefore(Instant.now())) bad("O prazo terminou. Gere uma nova atividade no próximo período.");
        db.update("update portal_extra set status='published' where id=? and school_id=?",id,actor.schoolId());
        row.put("status","published"); return row(row);
    }
    Map<String,Object> owned(Actor actor,String id,boolean studentOnly) {
        var rows=db.queryForList("select * from portal_extra where id=? and school_id=?",id,actor.schoolId());
        if(rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        var row=rows.get(0);
        if(studentOnly) {
            if(!actor.role().equals("student") || !auth.studentIds(actor).contains(((Number)row.get("student_id")).longValue()) || !row.get("status").equals("published")) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        } else auth.authorizeClass(actor,(String)row.get("course_id"),(String)row.get("class_id"));
        return row;
    }
    public List<Map<String,Object>> studentAssignments(Actor actor) {
        if(!actor.role().equals("student")) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        return db.queryForList("select e.* from portal_extra e join portal_member_student ms on ms.student_id=e.student_id where ms.member_id=? and e.school_id=? and e.status='published' order by e.due_at",actor.id(),actor.schoolId()).stream().map(this::row).toList();
    }
    @Transactional
    public Map<String,Object> start(Actor actor,String assignmentId,String questionId) {
        var row=owned(actor,assignmentId,true); checkDeadline(row);
        var question=question(row,questionId);
        long studentId=((Number)row.get("student_id")).longValue();
        db.queryForObject("select id from portal_extra where id=? for update",String.class,assignmentId);
        var attempts=db.queryForList("select id,started_at,answered_at from portal_attempt where assignment_id=? and student_id=? and question_id=?",assignmentId,studentId,questionId);
        if(attempts.isEmpty()) db.update("insert into portal_attempt(id,assignment_id,student_id,question_id,started_at) values(?,?,?,?,?)",UUID.randomUUID().toString(),assignmentId,studentId,questionId,Timestamp.from(Instant.now()));
        else if(attempts.get(0).get("answered_at")!=null) bad("Esta questão já foi respondida.");
        Map<String,Object> safe=new LinkedHashMap<>();
        for(String key:List.of("id","prompt","minSeconds","maxSeconds","images","source","level")) if(question.containsKey(key)) safe.put(key,question.get(key));
        safe.put("options",items(question,"options").stream().map(option->{Map<String,Object> out=new LinkedHashMap<>(); for(String key:List.of("id","text","image")) if(option.containsKey(key)) out.put(key,option.get(key)); return out;}).toList());
        safe.put("startedAt",db.queryForObject("select started_at from portal_attempt where assignment_id=? and student_id=? and question_id=?",Timestamp.class,assignmentId,studentId,questionId).toInstant().toString());
        return safe;
    }
    Map<String,Object> question(Map<String,Object> row,String id) { return items(parse((String)row.get("payload")),"questions").stream().filter(q->string(q,"id").equals(id)).findFirst().orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND)); }
    void checkDeadline(Map<String,Object> row) { if(((Timestamp)row.get("due_at")).toInstant().isBefore(Instant.now()) || row.get("completed_at")!=null) bad("Atividade encerrada."); }
    @Transactional
    public Map<String,Object> answer(Actor actor,String assignmentId,String questionId,String optionId) {
        var row=owned(actor,assignmentId,true);
        db.queryForObject("select id from portal_extra where id=? for update",String.class,assignmentId);
        row=owned(actor,assignmentId,true); checkDeadline(row);
        var question=question(row,questionId); long studentId=((Number)row.get("student_id")).longValue();
        if(items(question,"options").stream().noneMatch(option->string(option,"id").equals(optionId))) bad("Alternativa inválida.");
        var attempts=db.queryForList("select * from portal_attempt where assignment_id=? and student_id=? and question_id=? for update",assignmentId,studentId,questionId);
        if(attempts.isEmpty() || attempts.get(0).get("answered_at")!=null) bad("Inicie a questão antes de responder; cada questão aceita uma resposta.");
        var attempt=attempts.get(0); double seconds=Math.max(0,(Instant.now().toEpochMilli()-((Timestamp)attempt.get("started_at")).toInstant().toEpochMilli())/1000.0);
        boolean correct=string(question,"correctOptionId").equals(optionId);
        double min=((Number)question.get("minSeconds")).doubleValue(),max=((Number)question.get("maxSeconds")).doubleValue();
        double points=correct?100-90*Math.max(0,Math.min(1,(seconds-min)/(max-min))):0;
        db.update("update portal_attempt set answered_at=?,selected_option_id=?,correct=?,seconds=?,points=? where id=?",Timestamp.from(Instant.now()),optionId,correct,seconds,points,attempt.get("id"));
        db.queryForObject("select id from portal_school where id=? for update",String.class,actor.schoolId());
        var learning=documents.full(actor.schoolId(),"learning");
        Map<String,Object> evidence=new LinkedHashMap<>();
        evidence.put("id",attempt.get("id")); evidence.put("studentId",studentId); evidence.put("courseId",row.get("course_id")); evidence.put("classId",row.get("class_id"));
        evidence.put("questionId",questionId); evidence.put("selectedOptionId",optionId); evidence.put("correct",correct); evidence.put("seconds",Math.min(seconds,86400));
        evidence.put("grade",correct?10:0); evidence.put("totalQuestions",1); evidence.put("correctAnswers",correct?1:0); evidence.put("recordedAt",Instant.now().toString());
        evidence.put("extra",string(parse((String)row.get("payload")),"type").equals("extra")); evidence.put("assignmentTitle",parse((String)row.get("payload")).getOrDefault("title","Atividade")); evidence.put("questionPrompt",question.get("prompt")); evidence.put("content",question.get("content")); evidence.put("skill",question.get("skill")); evidence.put("assignmentId",assignmentId);
        var results=new ArrayList<>(items(learning,"results")); results.add(evidence); learning.put("results",results);
        long revision=((Number)learning.get("revision")).longValue();
        if(db.update("update portal_documents set revision=revision+1,payload=? where school_id=? and domain='learning' and revision=?",mapper.writeValueAsString(learning),actor.schoolId(),revision)!=1) throw new ResponseStatusException(HttpStatus.CONFLICT,"Reenvie sua resposta.");
        int count=db.queryForObject("select count(*) from portal_attempt where assignment_id=? and answered_at is not null",Integer.class,assignmentId);
        if(count==items(parse((String)row.get("payload")),"questions").size()) db.update("update portal_extra set completed_at=? where id=?",Timestamp.from(Instant.now()),assignmentId);
        return Map.of("correct",correct,"correctOptionId",question.get("correctOptionId"),"points",points,"seconds",seconds);
    }
    public List<Map<String,Object>> attempts(Actor actor,String assignmentId) {
        owned(actor,assignmentId,true);
        return db.queryForList("select question_id as \"questionId\",correct,seconds,points,selected_option_id as \"selectedOptionId\" from portal_attempt where assignment_id=? and answered_at is not null",assignmentId);
    }
    @Scheduled(fixedDelayString="${enigma.extras.interval-ms:3600000}",initialDelay=60000)
    @Transactional
    public void scheduled() {
        for(var school:db.queryForList("select id from portal_school",String.class)) {
            for(var policy:items(documents.full(school,"gamification"),"policies")) {
                for(var student:students.findAll()) if(school.equals(student.getSchoolId()) && matchesClass(student.getTurma(),string(policy,"classId"))) {
                    try { create(school,policy,student.getId()); }
                    catch(ResponseStatusException insufficient) { /* Aguarda questões aprovadas suficientes. */ }
                }
            }
        }
    }
}
