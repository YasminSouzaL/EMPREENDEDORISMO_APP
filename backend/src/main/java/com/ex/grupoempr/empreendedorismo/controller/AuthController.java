package com.ex.grupoempr.empreendedorismo.controller;

import com.ex.grupoempr.empreendedorismo.model.Aluno;
import com.ex.grupoempr.empreendedorismo.model.Professor;
import com.ex.grupoempr.empreendedorismo.repository.AlunoRepository;
import com.ex.grupoempr.empreendedorismo.repository.ProfessorRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final ProfessorRepository professorRepository;
    private final AlunoRepository alunoRepository;

    public AuthController(ProfessorRepository professorRepository,
                          AlunoRepository alunoRepository) {
        this.professorRepository = professorRepository;
        this.alunoRepository = alunoRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credenciais) {
        String email = credenciais.get("email");
        String senha = credenciais.get("senha");

        if (email == null || senha == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Informe e-mail e senha");
        }

        Optional<Professor> prof = professorRepository.findByEmail(email);
        if (prof.isPresent() && senha.equals(prof.get().getSenha())) {
            return ResponseEntity.ok(prof.get());
        }

        Optional<Aluno> aluno = alunoRepository.findByEmail(email);
        if (aluno.isPresent() && senha.equals(aluno.get().getSenha())) {
            return ResponseEntity.ok(aluno.get());
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("E-mail ou senha inválidos");
    }
}