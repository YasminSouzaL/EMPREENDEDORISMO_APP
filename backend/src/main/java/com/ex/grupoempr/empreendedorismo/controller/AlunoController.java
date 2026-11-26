package com.ex.grupoempr.empreendedorismo.controller;

import com.ex.grupoempr.empreendedorismo.model.Aluno;
import com.ex.grupoempr.empreendedorismo.model.Trilha;
import com.ex.grupoempr.empreendedorismo.model.dto.AlunoDto;
import com.ex.grupoempr.empreendedorismo.repository.AlunoRepository;
import com.ex.grupoempr.empreendedorismo.repository.TrilhaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/alunos")
public class AlunoController {

    private final AlunoRepository alunoRepository;
    private final TrilhaRepository trilhaRepository;

    Optional<Aluno> findByEmail(String email) {
        return null;
    }
    
    public AlunoController(
            AlunoRepository alunoRepository,
            TrilhaRepository trilhaRepository) {

        this.alunoRepository = alunoRepository;
        this.trilhaRepository = trilhaRepository;
    }

    @PostMapping
    public Aluno cadastrar(@RequestBody AlunoDto dto) {

        Trilha trilha = trilhaRepository.findById(dto.getTrilhaId())
                .orElseThrow(() -> new RuntimeException("Trilha não encontrada"));

        Aluno aluno = new Aluno();

        aluno.setNome(dto.getNome());
        aluno.setMatricula(dto.getMatricula());
        aluno.setTurma(dto.getTurma());
        aluno.setTrilha(trilha);
        aluno.setPontos(0);
        aluno.setSenha(null);

        return alunoRepository.save(aluno);
    }

    @GetMapping
    public List<Aluno> listar() {
        return alunoRepository.findAll();
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credenciais) {
        String email = credenciais.get("email");
        String senha = credenciais.getOrDefault("password", credenciais.get("senha"));

        return alunoRepository.findByEmail(email)
                .filter(aluno -> senha != null && aluno.getSenha().equals(senha))
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("E-mail ou senha inválidos"));
    }
}
