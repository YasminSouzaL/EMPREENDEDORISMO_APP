package com.ex.grupoempr.empreendedorismo.controller;

import com.ex.grupoempr.empreendedorismo.model.Ocorrencia;
import com.ex.grupoempr.empreendedorismo.repository.OcorrenciaRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ocorrencias")
public class OcorrenciaController {

    @Autowired
    private OcorrenciaRepository ocorrenciaRepository;

    @GetMapping
    public List<Ocorrencia> listarTodas() {
        return ocorrenciaRepository.findAll();
    }

    // Busca todas as ocorrências de um determinado aluno (útil para o perfil dos Pais)
    @GetMapping("/aluno/{alunoId}")
    public List<Ocorrencia> listarPorAluno(@PathVariable Long alunoId) {
        return ocorrenciaRepository.findByAlunoId(alunoId);
    }

    @PostMapping
    public ResponseEntity<Ocorrencia> cadastrar(@Valid @RequestBody Ocorrencia ocorrencia) {
        Ocorrencia novaOcorrencia = ocorrenciaRepository.save(ocorrencia);
        return ResponseEntity.status(HttpStatus.CREATED).body(novaOcorrencia);
    }
}