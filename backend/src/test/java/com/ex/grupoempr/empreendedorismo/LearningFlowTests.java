package com.ex.grupoempr.empreendedorismo;

import com.ex.grupoempr.empreendedorismo.learning.*;
import com.ex.grupoempr.empreendedorismo.portal.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static com.ex.grupoempr.empreendedorismo.learning.DocumentService.*;

@SpringBootTest(properties={"enigma.demo.enabled=true","enigma.demo.password=fixture-password-123"})
class LearningFlowTests {
    @Autowired PortalController portal;
    @Autowired PortalAuthService auth;
    @Autowired TeachingController teaching;
    @Autowired ExtraService extras;
    @Autowired StudentRankingController ranking;
    @Autowired DocumentService documents;
    @Autowired QuestionBankController questionBank;
    @Autowired JdbcTemplate db;
    @Autowired WebApplicationContext webContext;
    String login(String email) {return "Bearer "+portal.login(new PortalController.Login(email,"fixture-password-123")).get("accessToken");}
    @Test void publishedWorkFeedsEvidenceAndGroupAverageWithoutLeakingOtherGroups() {
        String teacher=login("professor@demo.enigma"),student=login("aluno@demo.enigma");var actor=auth.require(student);
        assertTrue(teaching.courses(student).stream().anyMatch(c->c.get("id").equals("matematica") && !items(c,"contents").isEmpty()));
        var content=teaching.createContent(teacher,Map.of("courseId","matematica","classId","matematica-3-a","title","Revisão","body","Compare as partes de um inteiro.","url",""));
        assertEquals("Revisão atualizada",teaching.editContent(teacher,string(content,"id"),Map.of("title","Revisão atualizada")).get("title"));
        teaching.deleteContent(teacher,string(content,"id"));
        var assigned=teaching.publish(teacher,Map.of("title","Simulado de revisão","type","simulation","courseId","matematica","classId","matematica-3-a","questionIds",List.of("demo-fraction","demo-percent","demo-multiply"),"studentIds",auth.studentIds(actor)));
        assertEquals(1,assigned.size());String id=string(assigned.get(0),"id");int before=items(documents.read(auth.require(teacher),"learning"),"results").size();
        for(String question:List.of("demo-fraction","demo-percent","demo-multiply")) {var safe=extras.start(actor,id,question);assertFalse(safe.containsKey("correctOptionId"));extras.answer(actor,id,question,question.equals("demo-fraction")?"a":"b");}
        var results=items(documents.read(auth.require(teacher),"learning"),"results");assertEquals(before+3,results.size());assertEquals(3,results.stream().filter(r->id.equals(r.get("assignmentId"))).count());assertTrue(results.stream().filter(r->id.equals(r.get("assignmentId"))).allMatch(r->r.containsKey("questionId") && r.containsKey("skill") && r.containsKey("content") && !Boolean.TRUE.equals(r.get("extra"))));
        assertEquals(3,extras.attempts(actor,id).size());assertThrows(ResponseStatusException.class,()->extras.answer(actor,id,"demo-fraction","a"));
        var own=ranking.groups(student).stream().filter(g->"demo-stars".equals(g.get("id"))).findFirst().orElseThrow();assertEquals(10.0/3,((Number)own.get("average")).doubleValue(),.001);
        assertEquals("Equipe da Luna",ranking.rename(student,"demo-stars",Map.of("name","Equipe da Luna")).get("name"));assertThrows(ResponseStatusException.class,()->ranking.rename(student,"demo-rockets",Map.of("name","Intrusão")));
        var learning=documents.read(auth.require(teacher),"learning");learning.put("results",new ArrayList<>());assertThrows(ResponseStatusException.class,()->documents.save(auth.require(teacher),"learning",learning));
        assertThrows(ResponseStatusException.class,()->teaching.createContent(student,Map.of("courseId","matematica","classId","matematica-3-a","title","Não permitido","body","Texto")));
    }
    @Test void groupGradeUsesEveryAnswerAndStudentsWithNoAnswersScoreZero() {
        List<Map<String,Object>> results=List.of(Map.of("studentId",1,"courseId","matematica","classId","matematica-3-a","correctAnswers",1,"totalQuestions",1),Map.of("studentId",1,"courseId","matematica","classId","matematica-3-a","correctAnswers",0,"totalQuestions",1),Map.of("studentId",1,"courseId","portugues","classId","portugues-3-a","correctAnswers",1,"totalQuestions",1));
        assertEquals(5,StudentRankingController.studentGrade(results,1,"matematica","matematica-3-a"));assertEquals(0,StudentRankingController.studentGrade(results,2,"matematica","matematica-3-a"));
        assertTrue(matchesClass("8º ano A","matematica-3-a"));assertFalse(matchesClass("7º ano A","matematica-3-a"));
    }
    @Test void questionBankRestoresMissingRowsAndCanRunAgainWithoutDuplicating() throws Exception {
        var sample=db.queryForMap("select id,payload from public_question order by id limit 1");
        assertEquals(500,db.queryForObject("select count(*) from public_question",Integer.class));
        db.update("delete from public_question where id=?",sample.get("id"));
        questionBank.run();
        assertEquals(500,db.queryForObject("select count(*) from public_question",Integer.class));
        assertEquals(sample.get("payload"),db.queryForObject("select payload from public_question where id=?",String.class,sample.get("id")));
        questionBank.run();
        assertEquals(500,db.queryForObject("select count(*) from public_question",Integer.class));
    }
    @Test void browserCanDeleteFromConfiguredOriginOnly() throws Exception {
        var mvc=MockMvcBuilders.webAppContextSetup(webContext).build();
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options("/teaching/contents/example")
                .header("Origin","http://localhost:5173").header("Access-Control-Request-Method","DELETE")
                .header("Access-Control-Request-Headers","authorization"))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk())
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Access-Control-Allow-Origin","http://localhost:5173"))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Access-Control-Allow-Methods",org.hamcrest.Matchers.containsString("DELETE")));
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options("/teaching/contents/example")
                .header("Origin","https://untrusted.example").header("Access-Control-Request-Method","DELETE"))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isForbidden());
    }
}
