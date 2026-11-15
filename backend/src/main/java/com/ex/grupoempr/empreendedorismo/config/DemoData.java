package com.ex.grupoempr.empreendedorismo.config;

import com.ex.grupoempr.empreendedorismo.portal.PasswordHasher;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

/** Prepara uma escola fictícia somente quando a demonstração é habilitada explicitamente. */
@Component
@ConditionalOnProperty(name="enigma.demo.enabled",havingValue="true")
public class DemoData implements ApplicationRunner {
    private final JdbcTemplate db;
    private final String password;
    private final JsonMapper mapper=JsonMapper.builder().build();
    public DemoData(JdbcTemplate db,@Value("${enigma.demo.password:}") String password) { this.db=db;this.password=password; }
    @Override @Transactional
    public void run(ApplicationArguments args) {
        if(password.length()<8) throw new IllegalStateException("Defina ENIGMA_DEMO_PASSWORD com ao menos 8 caracteres para habilitar a demonstração.");
        String school="00000000-0000-0000-0000-000000000001";
        if(db.queryForObject("select count(*) from portal_school where id=?",Integer.class,school)>0) return;
        db.update("insert into portal_school(id,name,accent,logo) values(?,?,?,?)",school,"Escola Horizonte · Demonstração","#7c3aed","");
        String admin=member(school,"Equipe Enigma","admin@demo.enigma","admin"),teacher=member(school,"Professora Marina","professor@demo.enigma","teacher"),studentMember=member(school,"Luna Oliveira","aluno@demo.enigma","student");
        List<Long> students=new ArrayList<>();for(String name:List.of("Luna Oliveira","Pedro Santos","Sofia Costa")) {String registration="DEMO-"+students.size();db.update("insert into aluno(nome,matricula,turma,school_id,pontos) values(?,?,?,?,0)",name,registration,"8º ano A",school);students.add(db.queryForObject("select id from aluno where matricula=?",Long.class,registration));}
        db.update("insert into portal_member_student(member_id,student_id) values(?,?)",studentMember,students.get(0));
        List<Map<String,Object>> questions=List.of(question("demo-fraction","matematica","Frações","Comparar frações","Qual fração equivale à metade?",List.of("1/2","1/3","1/4")),question("demo-percent","matematica","Porcentagem","Calcular porcentagens","Quanto é 25% de 100?",List.of("25","50","75")),question("demo-multiply","matematica","Multiplicação","Resolver operações","Quanto é 7 × 8?",List.of("56","48","64")),question("demo-reading","portugues","Interpretação de texto","Identificar informações","Em 'Luna leu três livros', quantos livros Luna leu?",List.of("Três","Dois","Quatro")),question("demo-verb","portugues","Verbos","Reconhecer verbos","Qual palavra indica uma ação?",List.of("Correr","Azul","Mesa")));
        List<Map<String,Object>> results=new ArrayList<>();for(int index=1;index<3;index++) for(int q=0;q<3;q++) {var question=questions.get(q);Map<String,Object> result=new LinkedHashMap<>();boolean correct=q<index;result.put("id",UUID.randomUUID().toString());result.put("studentId",students.get(index));result.put("courseId","matematica");result.put("classId","matematica-3-a");result.put("content",question.get("content"));result.put("skill",question.get("skill"));result.put("questionId",question.get("id"));result.put("selectedOptionId",correct?"a":"b");result.put("correct",correct);result.put("correctAnswers",correct?1:0);result.put("totalQuestions",1);result.put("grade",correct?10:0);result.put("seconds",30);result.put("extra",false);result.put("recordedAt",Instant.now().toString());results.add(result);}
        document(school,"learning",Map.of("questions",questions,"results",results,"observations",List.of()));
        List<Map<String,Object>> groups=List.of(group("demo-stars","Estrelas do Saber","matematica",List.of(students.get(0),students.get(1))),group("demo-rockets","Foguetes do Conhecimento","matematica",List.of(students.get(2))),group("demo-readers","Exploradores das Palavras","portugues",students));
        document(school,"gamification",Map.of("groups",groups,"policies",List.of(),"rounds",List.of(),"rewards",List.of(),"awards",List.of()));
        for(String course:List.of("matematica","portugues")) {
            String title=course.equals("matematica")?"Desafio dos números":"Missão das palavras";var selected=questions.stream().filter(q->course.equals(q.get("courseId"))).toList();Map<String,Object> payload=new LinkedHashMap<>();payload.put("title",title);payload.put("type",course.equals("matematica")?"simulation":"activity");payload.put("courseId",course);payload.put("courseName",course.equals("matematica")?"Matemática":"Português");payload.put("classId",course+"-3-a");payload.put("studentId",students.get(0));payload.put("questionIds",selected.stream().map(q->q.get("id")).toList());payload.put("questions",selected);payload.put("bonusPoints",0);payload.put("selectionBasis","Atividade demonstrativa revisada pela professora.");db.update("insert into portal_extra(id,school_id,student_id,policy_id,course_id,class_id,status,created_at,due_at,payload) values(?,?,?,?,?,?,?,?,?,?)",UUID.randomUUID().toString(),school,students.get(0),"teacher",course,course+"-3-a","published",Timestamp.from(Instant.now()),Timestamp.from(Instant.now().plus(30,ChronoUnit.DAYS)),mapper.writeValueAsString(payload));
            db.update("insert into portal_content(id,school_id,course_id,class_id,title,body,url,created_at) values(?,?,?,?,?,?,?,?)",UUID.randomUUID().toString(),school,course,course+"-3-a",course.equals("matematica")?"Frações e porcentagens":"Ler, compreender e descobrir",course.equals("matematica")?"Uma fração representa partes iguais de um inteiro. A metade pode ser escrita como 1/2 ou 50%. Antes da missão, desenhe um círculo e divida-o em duas partes iguais.":"Leia cada frase com atenção. Identifique quem realiza a ação, o que aconteceu e as informações que aparecem de forma explícita no texto.","",Timestamp.from(Instant.now()));
        }
    }
    private String member(String school,String name,String email,String role) {String id=UUID.randomUUID().toString();db.update("insert into portal_member(id,school_id,name,email,role,password_hash,course_ids,class_ids) values(?,?,?,?,?,?,?,?)",id,school,name,email,role,PasswordHasher.hash(password),role.equals("teacher")?"matematica,portugues":"","");return id;}
    private void document(String school,String domain,Map<String,Object> value) {db.update("insert into portal_documents(school_id,domain,revision,payload) values(?,?,1,?)",school,domain,mapper.writeValueAsString(value));}
    private Map<String,Object> group(String id,String name,String course,List<Long> students) {return Map.of("id",id,"name",name,"courseId",course,"classId",course+"-3-a","capacity",6,"studentIds",students);}
    private Map<String,Object> question(String id,String course,String content,String skill,String prompt,List<String> choices) {Map<String,Object> value=new LinkedHashMap<>();value.put("id",id);value.put("courseId",course);value.put("content",content);value.put("skill",skill);value.put("prompt",prompt);value.put("status","approved");value.put("minSeconds",5);value.put("maxSeconds",120);value.put("correctOptionId","a");value.put("tags",List.of("demonstração"));value.put("prerequisites",List.of());List<Map<String,String>> options=new ArrayList<>();for(int i=0;i<choices.size();i++) options.add(Map.of("id",String.valueOf((char)('a'+i)),"text",choices.get(i),"distractor","Revise o conteúdo e tente identificar a relação entre os dados."));value.put("options",options);return value;}
}
