package com.ex.grupoempr.empreendedorismo.controller;

import com.ex.grupoempr.empreendedorismo.model.Pais;
import com.ex.grupoempr.empreendedorismo.repository.PaisRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/pais")
public class PaisController {

    @Autowired
    private PaisRepository paisRepository;

    @GetMapping
    public List<Pais> listarTodos() {
        return paisRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Pais> buscarPorId(@PathVariable Long id) {
        return paisRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Pais> cadastrar(@Valid @RequestBody Pais pais) {
        Pais novoPais = paisRepository.save(pais);
        return ResponseEntity.status(HttpStatus.CREATED).body(novoPais);
    }

    // Endpoint de login simples por email/senha para o front
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credenciais) {
        String email = credenciais.get("email");
        String senha = credenciais.get("senha");

        Optional<Pais> paisOpt = paisRepository.findByEmail(email);
        if (paisOpt.isPresent() && paisOpt.get().getSenha().equals(senha)) {
            return ResponseEntity.ok(paisOpt.get());
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("E-mail ou senha inválidos");
    }
}