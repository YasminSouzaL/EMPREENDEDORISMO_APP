package com.ex.grupoempr.empreendedorismo.controller;

import com.ex.grupoempr.empreendedorismo.model.Aluno;
import com.ex.grupoempr.empreendedorismo.model.Trilha;
import com.ex.grupoempr.empreendedorismo.model.dto.AlunoDto;
import com.ex.grupoempr.empreendedorismo.repository.AlunoRepository;
import com.ex.grupoempr.empreendedorismo.repository.TrilhaRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/alunos")
public class AlunoController {

    private final AlunoRepository alunoRepository;
    private final TrilhaRepository trilhaRepository;
    private final com.ex.grupoempr.empreendedorismo.portal.PortalAuthService auth;

    public AlunoController(
            AlunoRepository alunoRepository,
            TrilhaRepository trilhaRepository, com.ex.grupoempr.empreendedorismo.portal.PortalAuthService auth) {

        this.alunoRepository = alunoRepository;
        this.trilhaRepository = trilhaRepository;
        this.auth = auth;
    }

    @PostMapping
    public Aluno cadastrar(@RequestHeader(value="Authorization",required=false) String token, @RequestBody AlunoDto dto) {
        var actor=auth.require(token); auth.requireManager(actor);
        if(dto.getNome()==null || dto.getNome().isBlank() || dto.getMatricula()==null || dto.getMatricula().isBlank() || dto.getTurma()==null || dto.getTurma().isBlank()) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST);

        Trilha trilha = trilhaRepository.findById(dto.getTrilhaId())
                .orElseThrow(() -> new RuntimeException("Trilha não encontrada"));

        Aluno aluno = new Aluno();

        aluno.setNome(dto.getNome());
        aluno.setMatricula(dto.getMatricula());
        aluno.setTurma(dto.getTurma());
        aluno.setTrilha(trilha);
        aluno.setPontos(0);
        aluno.setSchoolId(actor.schoolId());

        return alunoRepository.save(aluno);
    }

    @GetMapping
    public List<Aluno> listar(@RequestHeader(value="Authorization",required=false) String token) {
        var actor=auth.require(token);
        return alunoRepository.findAll().stream().filter(student -> auth.canReadStudent(actor,student)).toList();
    }
}
