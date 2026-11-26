package com.ex.grupoempr.empreendedorismo.repository;

import com.ex.grupoempr.empreendedorismo.model.Aluno;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AlunoRepository extends JpaRepository<Aluno, Long> {
    Optional<Aluno> findByEmail(String email);
    
}