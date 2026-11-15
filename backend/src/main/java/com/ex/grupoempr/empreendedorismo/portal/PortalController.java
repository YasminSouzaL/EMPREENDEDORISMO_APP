package com.ex.grupoempr.empreendedorismo.portal;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import static com.ex.grupoempr.empreendedorismo.portal.PortalAuthService.denied;

@RestController
public class PortalController {
    private final JdbcTemplate db;
    private final PortalAuthService auth;
    private final String dummyHash = PasswordHasher.hash("unused-dummy-password");
    public PortalController(JdbcTemplate db, PortalAuthService auth) { this.db = db; this.auth = auth; }
    public record Login(@NotBlank @Email @Size(max=254) String email, @NotBlank @Size(max=128) String password) { }
    public record SchoolInput(@NotBlank @Size(max=200) String schoolName, @NotBlank @Size(max=200) String name, @NotBlank @Email @Size(max=254) String email, @NotBlank @Size(min=8,max=128) String password) { }
    public record MemberInput(@NotBlank @Size(max=200) String name, @NotBlank @Email @Size(max=254) String email, @NotBlank String role, @NotNull @Size(max=100) List<String> courseIds, @NotNull @Size(max=250) List<String> classIds, @Size(max=128) String password) { }
    public record GuardianInput(@NotBlank @Size(max=200) String name, @NotBlank @Email @Size(max=254) String email, @NotNull @Size(max=80) String phone, @NotNull @Size(max=100) String relationship, @NotEmpty @Size(max=100) List<Long> studentIds) { }
    public record InvitationInput(@NotBlank String role, @NotBlank @Email @Size(max=254) String email, @NotEmpty @Size(max=100) List<Long> studentIds) { }
    public record FamilyInput(@NotBlank @Size(max=200) String name, @NotBlank @Email @Size(max=254) String email, @NotBlank @Size(min=8,max=128) String password, @NotBlank @Size(max=100) String invitationCode, @NotBlank String role) { }
    private String email(String value) { return value.trim().toLowerCase(Locale.ROOT); }
    private String id() { return UUID.randomUUID().toString(); }
    private Timestamp expiry(long hours) { return Timestamp.from(Instant.now().plus(hours, ChronoUnit.HOURS)); }

    @PostMapping("/escolas") @ResponseStatus(HttpStatus.CREATED) @Transactional
    public Map<String,String> registerSchool(@Valid @RequestBody SchoolInput input) {
        String schoolId = id();
        db.update("INSERT INTO portal_school(id,name,accent,logo) VALUES(?,?,?,?)", schoolId, input.schoolName().trim(), "#925023", "");
        db.update("INSERT INTO portal_member(id,school_id,name,email,role,password_hash,course_ids,class_ids) VALUES(?,?,?,?,?,?,?,?)", id(), schoolId, input.name().trim(), email(input.email()), "admin", PasswordHasher.hash(input.password()), "", "");
        return Map.of("id", schoolId);
    }
    @PostMapping("/auth/login") @Transactional
    public Map<String,String> login(@Valid @RequestBody Login input) {
        var rows = db.queryForList("SELECT id,password_hash FROM portal_member WHERE email=?", email(input.email()));
        String hash = rows.isEmpty() ? dummyHash : (String) rows.get(0).get("password_hash");
        if (!PasswordHasher.matches(input.password(), hash) || rows.isEmpty()) throw denied(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos.");
        String token = PasswordHasher.randomToken();
        db.update("DELETE FROM portal_session WHERE expires_at<CURRENT_TIMESTAMP");
        db.update("INSERT INTO portal_session(token_hash,member_id,expires_at) VALUES(?,?,?)", PasswordHasher.digest(token), rows.get(0).get("id"), expiry(12));
        return Map.of("accessToken", token);
    }
    @GetMapping("/auth/me")
    public Map<String,Object> profile(@RequestHeader(value="Authorization",required=false) String token) {
        var actor = auth.require(token);
        var school = db.queryForMap("SELECT id,name,accent,logo FROM portal_school WHERE id=?", actor.schoolId());
        return Map.of("member", actor, "school", school);
    }
    @PostMapping("/auth/logout") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@RequestHeader(value="Authorization",required=false) String token) {
        auth.require(token);
        db.update("DELETE FROM portal_session WHERE token_hash=?", PasswordHasher.digest(token.substring(7)));
    }
    @GetMapping("/integrantes")
    public List<PortalAuthService.Actor> members(@RequestHeader(value="Authorization",required=false) String token) {
        var actor = auth.require(token); auth.requireManager(actor);
        return db.query("SELECT * FROM portal_member WHERE school_id=? AND role IN ('admin','director','teacher','staff') ORDER BY name", PortalAuthService::actor, actor.schoolId());
    }
    @PostMapping("/integrantes") @ResponseStatus(HttpStatus.CREATED) @Transactional
    public PortalAuthService.Actor createMember(@RequestHeader(value="Authorization",required=false) String token, @Valid @RequestBody MemberInput input) { return saveMember(token, input, null); }
    @PatchMapping("/integrantes/{memberId}") @Transactional
    public PortalAuthService.Actor updateMember(@RequestHeader(value="Authorization",required=false) String token, @PathVariable String memberId, @Valid @RequestBody MemberInput input) { return saveMember(token, input, memberId); }
    private PortalAuthService.Actor saveMember(String token, MemberInput input, String memberId) {
        var actor = auth.require(token); auth.requireManager(actor);
        if (!Set.of("admin","director","teacher","staff").contains(input.role())) throw denied(HttpStatus.BAD_REQUEST, "Cargo inválido.");
        if (!actor.role().equals("admin") && input.role().equals("admin")) throw denied(HttpStatus.FORBIDDEN, "Somente administradores gerenciam administradores.");
        if (input.courseIds().stream().anyMatch(v -> v == null || !v.matches("[a-z]{3,30}")) || input.classIds().stream().anyMatch(v -> v == null || !v.matches("[a-z]{3,30}-[0-9]{1,2}-[ab]"))) throw denied(HttpStatus.BAD_REQUEST, "Vínculos inválidos.");
        if (memberId == null) {
            if (input.password() == null || input.password().length() < 8) throw denied(HttpStatus.BAD_REQUEST, "Informe uma senha com ao menos 8 caracteres.");
            memberId = id();
            db.update("INSERT INTO portal_member(id,school_id,name,email,role,password_hash,course_ids,class_ids) VALUES(?,?,?,?,?,?,?,?)", memberId, actor.schoolId(), input.name().trim(), email(input.email()), input.role(), PasswordHasher.hash(input.password()), String.join(",", input.courseIds()), String.join(",", input.classIds()));
        } else {
            var existing = db.query("SELECT * FROM portal_member WHERE id=? AND school_id=? AND role IN ('admin','director','teacher','staff')", PortalAuthService::actor, memberId, actor.schoolId());
            if (existing.isEmpty()) throw denied(HttpStatus.NOT_FOUND, "Integrante não encontrado.");
            if (!actor.role().equals("admin") && existing.get(0).role().equals("admin")) throw denied(HttpStatus.FORBIDDEN, "Somente administradores gerenciam administradores.");
            if (actor.id().equals(memberId) && !input.role().equals(actor.role())) throw denied(HttpStatus.BAD_REQUEST, "Não é possível alterar seu próprio cargo.");
            db.update("UPDATE portal_member SET name=?,email=?,role=?,course_ids=?,class_ids=? WHERE id=? AND school_id=?", input.name().trim(), email(input.email()), input.role(), String.join(",",input.courseIds()), String.join(",",input.classIds()), memberId, actor.schoolId());
            if (input.password() != null && !input.password().isBlank()) {
                if (input.password().length() < 8) throw denied(HttpStatus.BAD_REQUEST, "Informe uma senha com ao menos 8 caracteres.");
                db.update("UPDATE portal_member SET password_hash=? WHERE id=?", PasswordHasher.hash(input.password()), memberId);
                db.update("DELETE FROM portal_session WHERE member_id=?", memberId);
            }
        }
        return db.queryForObject("SELECT * FROM portal_member WHERE id=?", PortalAuthService::actor, memberId);
    }
    private void validateStudents(String schoolId, List<Long> studentIds) {
        if (studentIds.stream().anyMatch(Objects::isNull) || new HashSet<>(studentIds).size() != studentIds.size()) throw denied(HttpStatus.BAD_REQUEST, "Vínculos duplicados ou inválidos.");
        for (Long studentId : studentIds) {
            Integer count = db.queryForObject("SELECT COUNT(*) FROM aluno WHERE id=? AND school_id=?", Integer.class, studentId, schoolId);
            if (count == null || count != 1) throw denied(HttpStatus.BAD_REQUEST, "Aluno não pertence à escola.");
        }
    }
    @PostMapping("/convites") @ResponseStatus(HttpStatus.CREATED) @Transactional
    public Map<String,String> invite(@RequestHeader(value="Authorization",required=false) String token, @Valid @RequestBody InvitationInput input) {
        var actor = auth.require(token); auth.requireManager(actor);
        if (!Set.of("parent","student").contains(input.role()) || (input.role().equals("student") && input.studentIds().size()!=1)) throw denied(HttpStatus.BAD_REQUEST, "Convite inválido.");
        validateStudents(actor.schoolId(), input.studentIds());
        String code = PasswordHasher.randomToken(); String hash = PasswordHasher.digest(code);
        db.update("INSERT INTO portal_invitation(code_hash,school_id,email,role,expires_at) VALUES(?,?,?,?,?)", hash, actor.schoolId(), email(input.email()), input.role(), expiry(72));
        for (Long studentId : input.studentIds()) db.update("INSERT INTO portal_invitation_student(code_hash,student_id) VALUES(?,?)", hash, studentId);
        return Map.of("code", code);
    }
    @PostMapping("/auth/register-family") @ResponseStatus(HttpStatus.CREATED) @Transactional
    public void registerFamily(@Valid @RequestBody FamilyInput input) {
        String hash = PasswordHasher.digest(input.invitationCode());
        int changed = db.update("UPDATE portal_invitation SET consumed_at=CURRENT_TIMESTAMP WHERE code_hash=? AND email=? AND role=? AND consumed_at IS NULL AND expires_at>CURRENT_TIMESTAMP", hash, email(input.email()), input.role());
        if (changed != 1) throw denied(HttpStatus.BAD_REQUEST, "Convite inválido, expirado ou já utilizado.");
        String schoolId = db.queryForObject("SELECT school_id FROM portal_invitation WHERE code_hash=?", String.class, hash);
        var studentIds = db.queryForList("SELECT student_id FROM portal_invitation_student WHERE code_hash=?", Long.class, hash);
        validateStudents(schoolId, studentIds);
        String memberId = id();
        db.update("INSERT INTO portal_member(id,school_id,name,email,role,password_hash,course_ids,class_ids) VALUES(?,?,?,?,?,?,?,?)", memberId, schoolId, input.name().trim(), email(input.email()), input.role(), PasswordHasher.hash(input.password()), "", "");
        for (Long studentId : studentIds) db.update("INSERT INTO portal_member_student(member_id,student_id) VALUES(?,?)", memberId, studentId);
        if (input.role().equals("parent")) {
            String guardianId = id();
            db.update("INSERT INTO portal_guardian(id,school_id,name,email,phone,relationship) VALUES(?,?,?,?,?,?)", guardianId, schoolId, input.name().trim(), email(input.email()), "", "Responsável");
            for (Long studentId : studentIds) db.update("INSERT INTO portal_guardian_student(guardian_id,student_id) VALUES(?,?)", guardianId, studentId);
        }
    }
    private Map<String,Object> guardian(Map<String,Object> row) {
        var output = new LinkedHashMap<String,Object>();
        for (String key : List.of("id","name","email","phone","relationship")) output.put(key,row.get(key));
        output.put("studentIds", db.queryForList("SELECT student_id FROM portal_guardian_student WHERE guardian_id=? ORDER BY student_id", Long.class, row.get("id")));
        return output;
    }
    @GetMapping("/responsaveis")
    public List<Map<String,Object>> guardians(@RequestHeader(value="Authorization",required=false) String token) {
        var actor = auth.require(token); auth.requireManager(actor);
        return db.queryForList("SELECT * FROM portal_guardian WHERE school_id=? ORDER BY name", actor.schoolId()).stream().map(this::guardian).toList();
    }
    @PostMapping("/responsaveis") @ResponseStatus(HttpStatus.CREATED) @Transactional
    public Map<String,Object> createGuardian(@RequestHeader(value="Authorization",required=false) String token, @Valid @RequestBody GuardianInput input) { return saveGuardian(token,input,null); }
    @PatchMapping("/responsaveis/{guardianId}") @Transactional
    public Map<String,Object> updateGuardian(@RequestHeader(value="Authorization",required=false) String token, @PathVariable String guardianId, @Valid @RequestBody GuardianInput input) { return saveGuardian(token,input,guardianId); }
    private Map<String,Object> saveGuardian(String token, GuardianInput input, String guardianId) {
        var actor = auth.require(token); auth.requireManager(actor); validateStudents(actor.schoolId(), input.studentIds());
        if (guardianId == null) {
            guardianId = id();
            db.update("INSERT INTO portal_guardian(id,school_id,name,email,phone,relationship) VALUES(?,?,?,?,?,?)", guardianId,actor.schoolId(),input.name().trim(),email(input.email()),input.phone(),input.relationship());
        } else {
            if (db.update("UPDATE portal_guardian SET name=?,email=?,phone=?,relationship=? WHERE id=? AND school_id=?", input.name().trim(),email(input.email()),input.phone(),input.relationship(),guardianId,actor.schoolId()) != 1) throw denied(HttpStatus.NOT_FOUND, "Responsável não encontrado.");
            db.update("DELETE FROM portal_guardian_student WHERE guardian_id=?",guardianId);
        }
        for (Long studentId : input.studentIds()) db.update("INSERT INTO portal_guardian_student(guardian_id,student_id) VALUES(?,?)", guardianId,studentId);
        return guardian(db.queryForMap("SELECT * FROM portal_guardian WHERE id=?",guardianId));
    }
    @GetMapping("/familia/me")
    public Map<String,Object> family(@RequestHeader(value="Authorization",required=false) String token) {
        var actor = auth.require(token);
        if (!Set.of("parent","student").contains(actor.role())) throw denied(HttpStatus.FORBIDDEN, "Acesso exclusivo de famílias e alunos.");
        var students = db.queryForList("SELECT a.id,a.nome AS name,a.turma AS classroom FROM aluno a JOIN portal_member_student ms ON ms.student_id=a.id WHERE ms.member_id=? AND a.school_id=? ORDER BY a.nome",actor.id(),actor.schoolId());
        var guardians = db.queryForList("SELECT DISTINCT g.* FROM portal_guardian g JOIN portal_guardian_student gs ON gs.guardian_id=g.id JOIN portal_member_student ms ON ms.student_id=gs.student_id WHERE ms.member_id=? AND g.school_id=?",actor.id(),actor.schoolId()).stream().map(this::guardian).toList();
        // Evita expor vínculos de irmãos que não pertencem ao perfil autenticado.
        var allowed = auth.studentIds(actor);
        for (var guardian : guardians) guardian.put("studentIds", ((List<?>) guardian.get("studentIds")).stream().filter(allowed::contains).toList());
        return Map.of("students",students,"guardians",guardians);
    }
    @ExceptionHandler(DataIntegrityViolationException.class) @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String,String> conflict() { return Map.of("message","Já existe um cadastro com esses dados ou um vínculo é inválido."); }
}
