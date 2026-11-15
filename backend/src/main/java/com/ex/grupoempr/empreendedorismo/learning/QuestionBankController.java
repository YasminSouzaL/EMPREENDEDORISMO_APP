package com.ex.grupoempr.empreendedorismo.learning;

import com.ex.grupoempr.empreendedorismo.portal.PortalAuthService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;
import java.util.*;
import static com.ex.grupoempr.empreendedorismo.learning.DocumentService.*;

@RestController
public class QuestionBankController implements CommandLineRunner {
    private final JdbcTemplate db; private final PortalAuthService auth; private final DocumentService documents;
    private final JsonMapper mapper=JsonMapper.builder().build();
    public QuestionBankController(JdbcTemplate db,PortalAuthService auth,DocumentService documents) { this.db=db;this.auth=auth;this.documents=documents; }
    @Override @Transactional @SuppressWarnings("unchecked") public void run(String... args) throws Exception {
        var resource=new ClassPathResource("questions/enem-500.json");
        if(!resource.exists()) return;
        try(var stream=resource.getInputStream()) {
            Map<String,Object> data=mapper.readValue(stream,Map.class);
            // Uma consulta e lotes evitam centenas de viagens ao banco remoto na inicialização.
            Set<String> existing=new HashSet<>(db.queryForList("select id from public_question",String.class));
            var missing=items(data,"questions").stream().filter(question->existing.add(string(question,"id"))).toList();
            db.batchUpdate("insert into public_question(id,course_id,payload) values(?,?,?)",missing,250,(statement,question)->{
                statement.setString(1,string(question,"id"));
                statement.setString(2,string(question,"courseId"));
                statement.setString(3,mapper.writeValueAsString(question));
            });
        }
    }
    @GetMapping("/question-bank") @SuppressWarnings("unchecked")
    public List<Map<String,Object>> list(@RequestHeader(value="Authorization",required=false) String token,@RequestParam String courseId) {
        var actor=auth.require(token); requireTeacher(actor);
        if(actor.role().equals("teacher") && !actor.courseIds().contains(courseId) && actor.classIds().stream().noneMatch(id->id.startsWith(courseId+"-"))) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        return db.query("select payload from public_question where course_id=? order by id",(rs,n)->mapper.readValue(rs.getString(1),Map.class),courseId).stream().map(value->(Map<String,Object>)value).toList();
    }
    @PostMapping("/learning/import-public") @Transactional @SuppressWarnings("unchecked")
    public Map<String,Object> importQuestions(@RequestHeader(value="Authorization",required=false) String token,@RequestBody Map<String,Object> input) {
        var actor=auth.require(token); requireTeacher(actor);
        var learning=documents.read(actor,"learning");
        if(!(input.get("questionIds") instanceof List<?> ids) || ids.isEmpty() || ids.size()>50) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Selecione de 1 a 50 questões.");
        var questions=new ArrayList<>(items(learning,"questions"));
        for(Object id:ids) {
            var rows=db.queryForList("select payload from public_question where id=?",String.class,String.valueOf(id));
            if(rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
            Map<String,Object> question=mapper.readValue(rows.get(0),Map.class);
            if(questions.stream().noneMatch(q->string(q,"id").equals(id))) questions.add(question);
        }
        learning.put("questions",questions); return documents.save(actor,"learning",learning);
    }
}
