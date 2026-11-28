
// package com.ex.grupoempr.empreendedorismo.controller;

// import com.ex.grupoempr.empreendedorismo.model.Escola;
// import com.ex.grupoempr.empreendedorismo.model.Professor;
// import com.ex.grupoempr.empreendedorismo.repository.ProfessorRepository;
// import org.springframework.http.HttpStatus;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.*;

// import java.time.Duration;
// import java.time.Instant;
// import java.util.List;
// import java.util.Map;
// import java.util.UUID;
// import java.util.concurrent.ConcurrentHashMap;
// import java.util.concurrent.ConcurrentMap;

// @RestController
// @RequestMapping("/auth")
// public class AuthController {

//     private static final Duration SESSION_TTL = Duration.ofHours(8);
//     private static final String DEFAULT_SCHOOL_ACCENT = "#2563eb";

//     private final ProfessorRepository professorRepository;
//     private final ConcurrentMap<String, AuthSession> sessions = new ConcurrentHashMap<>();

//     public AuthController(ProfessorRepository professorRepository) {
//         this.professorRepository = professorRepository;
//     }

//     @PostMapping("/login")
//     public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
//         String email = credentials.get("email");
//         String password = credentials.getOrDefault("password", credentials.get("senha"));
//         if (email == null || email.isBlank() || password == null || password.isEmpty()) {
//             return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("E-mail ou senha inválidos");
//         }

//         Professor professor = professorRepository.findByEmail(email)
//                 .filter(candidate -> password.equals(candidate.getSenha()))
//                 .orElse(null);
//         if (professor == null) {
//             return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("E-mail ou senha inválidos");
//         }
//         if (professor.getEscola() == null) {
//             return ResponseEntity.status(HttpStatus.CONFLICT).body("Conta sem escola associada");
//         }

//         Instant expiresAt = Instant.now().plus(SESSION_TTL);
//         sessions.entrySet().removeIf(entry -> !entry.getValue().expiresAt().isAfter(Instant.now()));
//         String accessToken = UUID.randomUUID().toString();
//         sessions.put(accessToken, new AuthSession(professor.getId(), expiresAt));
//         return ResponseEntity.ok(new LoginResponse(accessToken));
//     }

//     @GetMapping("/me")
//     public ResponseEntity<?> profile(@RequestHeader(value = "Authorization", required = false) String authorization) {
//         String accessToken = bearerToken(authorization);
//         AuthSession session = accessToken == null ? null : sessions.get(accessToken);
//         if (session == null || !session.expiresAt().isAfter(Instant.now())) {
//             if (accessToken != null) sessions.remove(accessToken);
//             return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
//         }

//         Professor professor = professorRepository.findById(session.professorId()).orElse(null);
//         if (professor == null) {
//             sessions.remove(accessToken);
//             return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
//         }
//         Escola escola = professor.getEscola();
//         if (escola == null) {
//             return ResponseEntity.status(HttpStatus.CONFLICT).body("Conta sem escola associada");
//         }

//         MemberProfile member = new MemberProfile(
//                 String.valueOf(professor.getId()),
//                 String.valueOf(escola.getId()),
//                 professor.getNome(),
//                 professor.getEmail(),
//                 "teacher",
//                 List.of(),
//                 List.of());
//         SchoolProfile school = new SchoolProfile(
//                 String.valueOf(escola.getId()),
//                 escola.getNome(),
//                 DEFAULT_SCHOOL_ACCENT,
//                 "");
//         return ResponseEntity.ok(new AuthProfile(member, school));
//     }

//     private String bearerToken(String authorization) {
//         if (authorization == null || !authorization.startsWith("Bearer ")) return null;
//         String token = authorization.substring("Bearer ".length()).trim();
//         return token.isEmpty() ? null : token;
//     }

//     private record AuthSession(Long professorId, Instant expiresAt) {}
//     public record LoginResponse(String accessToken) {}
//     public record AuthProfile(MemberProfile member, SchoolProfile school) {}
//     public record MemberProfile(
//             String id,
//             String schoolId,
//             String name,
//             String email,
//             String role,
//             List<String> courseIds,
//             List<String> classIds) {}
//     public record SchoolProfile(String id, String name, String accent, String logo) {}
// }
package com.ex.grupoempr.empreendedorismo.controller;

import com.ex.grupoempr.empreendedorismo.model.Aluno;
import com.ex.grupoempr.empreendedorismo.model.Escola;
import com.ex.grupoempr.empreendedorismo.model.Professor;
import com.ex.grupoempr.empreendedorismo.repository.AlunoRepository;
import com.ex.grupoempr.empreendedorismo.repository.ProfessorRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final Duration SESSION_TTL = Duration.ofHours(8);
    private static final String DEFAULT_SCHOOL_ACCENT = "#2563eb";

    private final ProfessorRepository professorRepository;
    private final AlunoRepository alunoRepository;
    private final ConcurrentMap<String, AuthSession> sessions = new ConcurrentHashMap<>();

    public AuthController(ProfessorRepository professorRepository, AlunoRepository alunoRepository) {
        this.professorRepository = professorRepository;
        this.alunoRepository = alunoRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.getOrDefault("password", credentials.get("senha"));
        if (email == null || email.isBlank() || password == null || password.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("E-mail ou senha inválidos");
        }

        Professor professor = professorRepository.findByEmail(email)
                .filter(candidate -> password.equals(candidate.getSenha()))
                .orElse(null);

        if (professor != null) {
            if (professor.getEscola() == null) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Conta sem escola associada");
            }
            String accessToken = createSession(professor.getId(), "teacher");
            return ResponseEntity.ok(new LoginResponse(accessToken));
        }

        Aluno aluno = alunoRepository.findByEmail(email)
                .filter(candidate -> password.equals(candidate.getSenha()))
                .orElse(null);

        if (aluno != null) {
            if (aluno.getEscola() == null) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Conta sem escola associada");
            }
            String accessToken = createSession(aluno.getId(), "student");
            return ResponseEntity.ok(new LoginResponse(accessToken));
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("E-mail ou senha inválidos");
    }

    @GetMapping("/me")
    public ResponseEntity<?> profile(@RequestHeader(value = "Authorization", required = false) String authorization) {
        String accessToken = bearerToken(authorization);
        AuthSession session = accessToken == null ? null : sessions.get(accessToken);
        if (session == null || !session.expiresAt().isAfter(Instant.now())) {
            if (accessToken != null) sessions.remove(accessToken);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if ("student".equals(session.role())) {
            Aluno aluno = alunoRepository.findById(session.userId()).orElse(null);
            if (aluno == null) {
                sessions.remove(accessToken);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            Escola escola = aluno.getEscola();
            if (escola == null) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Conta sem escola associada");
            }

            MemberProfile member = new MemberProfile(
                    String.valueOf(aluno.getId()),
                    String.valueOf(escola.getId()),
                    aluno.getNome(),
                    aluno.getEmail(),
                    "student",
                    List.of(),
                    List.of());
            SchoolProfile school = new SchoolProfile(
                    String.valueOf(escola.getId()),
                    escola.getNome(),
                    DEFAULT_SCHOOL_ACCENT,
                    "");
            return ResponseEntity.ok(new AuthProfile(member, school));
        }

        Professor professor = professorRepository.findById(session.userId()).orElse(null);
        if (professor == null) {
            sessions.remove(accessToken);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Escola escola = professor.getEscola();
        if (escola == null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Conta sem escola associada");
        }

        MemberProfile member = new MemberProfile(
                String.valueOf(professor.getId()),
                String.valueOf(escola.getId()),
                professor.getNome(),
                professor.getEmail(),
                "teacher",
                List.of(),
                List.of());
        SchoolProfile school = new SchoolProfile(
                String.valueOf(escola.getId()),
                escola.getNome(),
                DEFAULT_SCHOOL_ACCENT,
                "");
        return ResponseEntity.ok(new AuthProfile(member, school));
    }

    private String createSession(Long userId, String role) {
        Instant expiresAt = Instant.now().plus(SESSION_TTL);
        sessions.entrySet().removeIf(entry -> !entry.getValue().expiresAt().isAfter(Instant.now()));
        String accessToken = UUID.randomUUID().toString();
        sessions.put(accessToken, new AuthSession(userId, role, expiresAt));
        return accessToken;
    }

    private String bearerToken(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) return null;
        String token = authorization.substring("Bearer ".length()).trim();
        return token.isEmpty() ? null : token;
    }

    private record AuthSession(Long userId, String role, Instant expiresAt) {}
    public record LoginResponse(String accessToken) {}
    public record AuthProfile(MemberProfile member, SchoolProfile school) {}
    public record MemberProfile(
            String id,
            String schoolId,
            String name,
            String email,
            String role,
            List<String> courseIds,
            List<String> classIds) {}
    public record SchoolProfile(String id, String name, String accent, String logo) {}
}
