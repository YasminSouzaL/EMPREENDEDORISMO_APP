package com.ex.grupoempr.empreendedorismo.learning;

import java.util.*;
import static com.ex.grupoempr.empreendedorismo.learning.DocumentService.*;

public final class GamificationValidator {
    private GamificationValidator() {}
    static double number(Map<String,Object> item,String key,double min,double max) {
        if (!(item.get(key) instanceof Number value) || !Double.isFinite(value.doubleValue()) || value.doubleValue()<min || value.doubleValue()>max) { bad("Valor inválido: "+key); return 0; }
        return ((Number)item.get(key)).doubleValue();
    }
    static int integer(Map<String,Object> item,String key,int min,int max) { double value=number(item,key,min,max); if(value!=Math.floor(value)) bad("Quantidade deve ser inteira."); return (int)value; }
    static void text(Map<String,Object> item,String key,int max) { if(string(item,key).isBlank() || string(item,key).length()>max) bad("Texto inválido: "+key); }
    public static List<Long> ids(Map<String,Object> group) {
        if(!(group.get("studentIds") instanceof List<?>)) bad("Participantes inválidos.");
        List<Long> ids=((List<?>)group.get("studentIds")).stream().map(DocumentService::asId).toList();
        if(ids.isEmpty() || new HashSet<>(ids).size()!=ids.size()) bad("Participantes vazios ou duplicados.");
        return ids;
    }
    public static double points(Map<String,Object> round, Map<String,Object> result) {
        if(!Boolean.TRUE.equals(result.get("correct"))) return 0;
        double min=((Number)round.get("minSeconds")).doubleValue(), max=((Number)round.get("maxSeconds")).doubleValue();
        double low=((Number)round.get("minPoints")).doubleValue(), high=((Number)round.get("maxPoints")).doubleValue();
        double seconds=((Number)result.get("elapsedSeconds")).doubleValue();
        return high-(high-low)*Math.max(0,Math.min(1,(seconds-min)/(max-min)));
    }
    public static void validate(Map<String,Object> data,Map<String,Object> previous) {
        Set<String> memberships=new HashSet<>();
        for(var group:items(data,"groups")) {
            text(group,"name",100); text(group,"courseId",40); text(group,"classId",60);
            int capacity=integer(group,"capacity",1,100);
            if(ids(group).size()>capacity) bad("Capacidade excedida.");
            for(Long id:ids(group)) if(!memberships.add(string(group,"courseId")+"/"+string(group,"classId")+"/"+id)) bad("Aluno já pertence a um grupo nesta turma e disciplina.");
        }
        Set<String> policies=new HashSet<>();
        for(var policy:items(data,"policies")) {
            text(policy,"courseId",40); text(policy,"classId",60);
            if(!policies.add(string(policy,"courseId")+"/"+string(policy,"classId"))) bad("Política duplicada.");
            integer(policy,"periodDays",1,365); integer(policy,"deadlineDays",1,365); integer(policy,"questionCount",1,100);
            number(policy,"bonusPoints",0,10000);
            if(!Set.of("teacher","automatic").contains(string(policy,"approvalMode"))) bad("Modo inválido.");
        }
        for(var reward:items(data,"rewards")) {
            text(reward,"name",100); number(reward,"minimumScore",0,10000);
            if(!Set.of("star","rocket","gem","medal").contains(string(reward,"icon"))) bad("Recompensa inválida.");
        }
        for(var round:items(data,"rounds")) {
            text(round,"title",120); text(round,"courseId",40); text(round,"classId",60);
            double min=number(round,"minSeconds",0,86400), max=number(round,"maxSeconds",1,86400);
            if(max<=min || number(round,"maxPoints",0,10000)<number(round,"minPoints",0,10000)) bad("Limites de pontuação inválidos.");
            Set<Long> participants=new HashSet<>();
            if(items(round,"groups").isEmpty()) bad("Crie grupos antes da rodada.");
            for(var group:items(round,"groups")) for(Long id:ids(group)) if(!participants.add(id)) bad("Participante duplicado na rodada.");
            for(var old:items(previous,"rounds")) if(string(old,"id").equals(string(round,"id"))) {
                for(String key:List.of("groups","minSeconds","maxSeconds","minPoints","maxPoints")) if(!Objects.equals(old.get(key),round.get(key))) bad("A composição e regras da rodada são imutáveis.");
            }
            Set<Long> responses=new HashSet<>();
            for(var result:items(round,"results")) {
                long id=asId(result.get("studentId"));
                if(!participants.contains(id) || !responses.add(id) || !(result.get("correct") instanceof Boolean)) bad("Resposta inválida.");
                number(result,"elapsedSeconds",0,86400);
            }
        }
        Set<String> awards=new HashSet<>();
        for(var award:items(data,"awards")) {
            long student=asId(award.get("studentId"));
            var round=items(data,"rounds").stream().filter(r->string(r,"id").equals(string(award,"roundId"))).findFirst().orElseThrow(()->new IllegalArgumentException("Rodada ausente"));
            var reward=items(data,"rewards").stream().filter(r->string(r,"id").equals(string(award,"rewardId"))).findFirst().orElseThrow(()->new IllegalArgumentException("Recompensa ausente"));
            if(!awards.add(student+"/"+string(award,"roundId")+"/"+string(award,"rewardId"))) bad("Recompensa já atribuída.");
            double score=items(round,"results").stream().filter(r->asId(r.get("studentId"))==student).mapToDouble(r->points(round,r)).findFirst().orElse(0);
            if(score<((Number)reward.get("minimumScore")).doubleValue()) bad("Pontuação insuficiente para a recompensa.");
        }
    }
}
