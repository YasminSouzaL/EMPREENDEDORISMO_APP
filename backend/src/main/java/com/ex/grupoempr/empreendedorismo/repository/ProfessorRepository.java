package com.ex.grupoempr.empreendedorismo.repository;

import com.ex.grupoempr.empreendedorismo.model.Professor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;


public interface ProfessorRepository extends JpaRepository<Professor, Long> {
    // Útil para o login do professor por e-mail
    Optional<Professor> findByEmail(String email);
}