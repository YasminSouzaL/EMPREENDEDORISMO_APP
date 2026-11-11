package com.ex.grupoempr.empreendedorismo.controller;

import com.ex.grupoempr.empreendedorismo.model.Evento;
import com.ex.grupoempr.empreendedorismo.repository.EventoRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/eventos")
public class EventoController {

    @Autowired
    private EventoRepository eventoRepository;

    @GetMapping
    public List<Evento> listarTodos() {
        return eventoRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Evento> buscarPorId(@PathVariable Long id) {
        return eventoRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Evento> cadastrar(@Valid @RequestBody Evento evento) {
        Evento novoEvento = eventoRepository.save(evento);
        return ResponseEntity.status(HttpStatus.CREATED).body(novoEvento);
    }
}