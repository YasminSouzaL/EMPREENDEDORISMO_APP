package com.ex.grupoempr.empreendedorismo.learning;

import com.ex.grupoempr.empreendedorismo.portal.PortalAuthService;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;
import java.util.*;
import static com.ex.grupoempr.empreendedorismo.learning.DocumentService.*;

@RestController
public class StudentRankingController {
    private final PortalAuthService auth; private final DocumentService documents; private final JdbcTemplate db;
    public StudentRankingController(PortalAuthService auth,DocumentService documents,JdbcTemplate db) { this.auth=auth;this.documents=documents;this.db=db; }
    private PortalAuthService.Actor student(String token) { var actor=auth.require(token);if(!actor.role().equals("student")) throw new ResponseStatusException(HttpStatus.FORBIDDEN);return actor; }
    public static double studentGrade(List<Map<String,Object>> results,long student,String course,String classId) {
        double correct=0,total=0;for(var result:results) if(asId(result.get("studentId"))==student && course.equals(string(result,"courseId")) && classId.equals(string(result,"classId"))) {correct+=((Number)result.get("correctAnswers")).doubleValue();total+=((Number)result.get("totalQuestions")).doubleValue();}return total==0?0:10*correct/total;
    }
    private Map<String,Object> scored(Map<String,Object> group,List<Map<String,Object>> results,List<Long> own) {
        var ids=GamificationValidator.ids(group);var result=new LinkedHashMap<>(group);result.put("average",ids.stream().mapToDouble(id->studentGrade(results,id,string(group,"courseId"),string(group,"classId"))).average().orElse(0));result.put("own",ids.stream().anyMatch(own::contains));result.put("memberCount",ids.size());return result;
    }
    private List<Map<String,Object>> groups(PortalAuthService.Actor actor) {
        var own=auth.studentIds(actor);var all=items(documents.full(actor.schoolId(),"gamification"),"groups");var results=items(documents.full(actor.schoolId(),"learning"),"results");
        Set<String> scopes=new HashSet<>();for(var group:all) if(GamificationValidator.ids(group).stream().anyMatch(own::contains)) scopes.add(string(group,"courseId")+"/"+string(group,"classId"));
        return all.stream().filter(g->scopes.contains(string(g,"courseId")+"/"+string(g,"classId"))).map(g->scored(g,results,own)).sorted(Comparator.comparingDouble(g->-((Number)g.get("average")).doubleValue())).toList();
    }
    @GetMapping("/student/groups")
    public List<Map<String,Object>> groups(@RequestHeader(value="Authorization",required=false) String token) { return groups(student(token)); }
    @PatchMapping("/student/groups/{id}") @Transactional
    public Map<String,Object> rename(@RequestHeader(value="Authorization",required=false) String token,@PathVariable String id,@RequestBody Map<String,Object> input) {
        var actor=student(token);String name=string(input,"name").trim();if(name.isEmpty() || name.length()>100) bad("O nome deve ter de 1 a 100 caracteres.");
        db.queryForObject("select id from portal_school where id=? for update",String.class,actor.schoolId());var data=documents.full(actor.schoolId(),"gamification");
        var group=items(data,"groups").stream().filter(g->id.equals(g.get("id"))).findFirst().orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));if(GamificationValidator.ids(group).stream().noneMatch(auth.studentIds(actor)::contains)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        group.put("name",name);db.update("update portal_documents set revision=revision+1,payload=? where school_id=? and domain='gamification'",JsonMapper.builder().build().writeValueAsString(data),actor.schoolId());return scored(group,items(documents.full(actor.schoolId(),"learning"),"results"),auth.studentIds(actor));
    }
    @GetMapping("/student/ranking")
    public Map<String,Object> ranking(@RequestHeader(value="Authorization",required=false) String token) {
        var actor=student(token);var own=auth.studentIds(actor);var groups=groups(actor);var results=items(documents.full(actor.schoolId(),"learning"),"results");List<Map<String,Object>> rounds=new ArrayList<>();Set<String> scopes=new LinkedHashSet<>();for(var group:groups) scopes.add(string(group,"courseId")+"/"+string(group,"classId"));
        for(String scope:scopes) {var selected=groups.stream().filter(g->scope.equals(string(g,"courseId")+"/"+string(g,"classId"))).toList();var first=selected.get(0);rounds.add(Map.of("id",scope,"title",TeachingController.COURSES.getOrDefault(string(first,"courseId"),string(first,"courseId")),"courseId",first.get("courseId"),"classId",first.get("classId"),"ownPoints",own.stream().mapToDouble(id->studentGrade(results,id,string(first,"courseId"),string(first,"classId"))).average().orElse(0),"groups",selected));}
        var data=documents.full(actor.schoolId(),"gamification");Set<String> rewardIds=new HashSet<>();for(var award:items(data,"awards")) if(own.contains(asId(award.get("studentId")))) rewardIds.add(string(award,"rewardId"));
        return Map.of("rounds",rounds,"rewards",items(data,"rewards").stream().filter(r->rewardIds.contains(string(r,"id"))).map(r->Map.of("id",r.get("id"),"name",r.get("name"),"icon",r.get("icon"))).toList(),"scoreBasis","Média das notas dos integrantes (0 a 10). A nota individual é a proporção de acertos em todas as atividades e simulados da disciplina e turma; sem respostas, a nota é zero.");
    }
}
