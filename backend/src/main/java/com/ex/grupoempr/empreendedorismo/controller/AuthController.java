package com.ex.grupoempr.empreendedorismo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private ProfessorController professorController;

    @Autowired 
    private AlunoController alunoController;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credenciais) {
        ResponseEntity<?> resposta = professorController.login(credenciais);
        if (resposta.getStatusCode().is2xxSuccessful()) {
            return resposta;
        }
        return alunoController.login(credenciais);
    }
}