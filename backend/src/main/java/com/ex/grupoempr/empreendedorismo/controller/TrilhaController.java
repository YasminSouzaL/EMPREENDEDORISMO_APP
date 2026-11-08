package com.ex.grupoempr.empreendedorismo.controller;

import com.ex.grupoempr.empreendedorismo.model.Trilha;
import com.ex.grupoempr.empreendedorismo.repository.TrilhaRepository;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:8080")
public class TrilhaController {

    private final TrilhaRepository trilhaRepository;

    public TrilhaController(TrilhaRepository trilhaRepository) {
        this.trilhaRepository = trilhaRepository;
    }

    @GetMapping("/trilhas")
    public List<Trilha> listarTrilhas() {
        return trilhaRepository.findAll();
    }
}