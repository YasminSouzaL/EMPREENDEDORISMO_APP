package com.ex.grupoempr.empreendedorismo.portal;

import com.ex.grupoempr.empreendedorismo.model.Aluno;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PortalAuthService {
    private final JdbcTemplate db;
    public PortalAuthService(JdbcTemplate db) { this.db = db; }
    public record Actor(String id, String schoolId, String name, String email, String role, List<String> courseIds, List<String> classIds) { }
    public static Actor actor(ResultSet row, int index) throws SQLException {
        return new Actor(row.getString("id"), row.getString("school_id"), row.getString("name"), row.getString("email"), row.getString("role"), split(row.getString("course_ids")), split(row.getString("class_ids")));
    }
    public static List<String> split(String value) { return value == null || value.isBlank() ? List.of() : Arrays.asList(value.split(",")); }
    public Actor require(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ") || authorization.length() > 256) throw denied(HttpStatus.UNAUTHORIZED, "Sessão inválida.");
        var rows = db.query("SELECT m.* FROM portal_member m JOIN portal_session s ON s.member_id=m.id WHERE s.token_hash=? AND s.expires_at>CURRENT_TIMESTAMP", PortalAuthService::actor, PasswordHasher.digest(authorization.substring(7)));
        if (rows.isEmpty()) throw denied(HttpStatus.UNAUTHORIZED, "Sessão expirada ou inválida.");
        return rows.get(0);
    }
    public void requireManager(Actor actor) {
        if (!Set.of("admin", "director").contains(actor.role())) throw denied(HttpStatus.FORBIDDEN, "Acesso restrito à gestão da escola.");
    }
    public void requireStaff(Actor actor) {
        if (!Set.of("admin", "director", "teacher", "staff").contains(actor.role())) throw denied(HttpStatus.FORBIDDEN, "Acesso restrito à equipe escolar.");
    }
    public void authorizeClass(Actor actor, String courseId, String classId) {
        requireStaff(actor);
        if ("teacher".equals(actor.role()) && !actor.courseIds().contains(courseId) && !actor.classIds().contains(classId)) throw denied(HttpStatus.FORBIDDEN, "Turma fora dos seus vínculos.");
        if (classId != null && !classId.isBlank() && !classId.startsWith(courseId + "-")) throw denied(HttpStatus.BAD_REQUEST, "Turma incompatível com a disciplina.");
    }
    public List<Long> studentIds(Actor actor) { return db.queryForList("SELECT student_id FROM portal_member_student WHERE member_id=?", Long.class, actor.id()); }
    public boolean canReadStudent(Actor actor, Aluno student) {
        if (!actor.schoolId().equals(student.getSchoolId())) return false;
        if (Set.of("parent", "student").contains(actor.role())) return studentIds(actor).contains(student.getId());
        if (!"teacher".equals(actor.role())) return true;
        return actor.courseIds().stream().anyMatch(course -> courseSupportsClass(course, student.getTurma())) || actor.classIds().stream().anyMatch(id -> classLabel(id).equals(student.getTurma()));
    }
    private static boolean courseSupportsClass(String course, String label) {
        boolean secondary = label.matches("[123]ª série [AB]");
        boolean fundamental = label.matches("[1-9]º ano [AB]");
        return switch (course) {
            case "matematica", "portugues", "historia", "geografia" -> secondary || fundamental;
            case "ciencias" -> fundamental;
            case "fisica", "quimica", "biologia" -> secondary;
            default -> false;
        };
    }
    public static String classLabel(String id) {
        String[] parts = id.split("-");
        String[] grades = {"6º ano", "7º ano", "8º ano", "9º ano", "1ª série", "2ª série", "3ª série", "1º ano", "2º ano", "3º ano", "4º ano", "5º ano"};
        try {
            int index = Integer.parseInt(parts[parts.length - 2]) - 1;
            String section = parts[parts.length - 1].toUpperCase(java.util.Locale.ROOT);
            return index >= 0 && index < grades.length && Set.of("A", "B").contains(section) ? grades[index] + " " + section : "";
        } catch (RuntimeException ex) { return ""; }
    }
    public static ResponseStatusException denied(HttpStatus status, String message) { return new ResponseStatusException(status, message); }
}
