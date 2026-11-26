package com.ex.grupoempr.empreendedorismo.repository;

import com.ex.grupoempr.empreendedorismo.model.Aluno;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AlunoRepository extends JpaRepository<Aluno, Long> {
    Optional<Aluno> findByEmail(String email);
}