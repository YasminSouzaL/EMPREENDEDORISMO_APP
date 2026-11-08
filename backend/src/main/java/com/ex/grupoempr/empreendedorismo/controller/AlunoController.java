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

        return alunoRepository.save(aluno);
    }

    @GetMapping
    public List<Aluno> listar() {
        return alunoRepository.findAll();
    }
}
