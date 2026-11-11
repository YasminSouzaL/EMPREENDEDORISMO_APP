package com.ex.grupoempr.empreendedorismo.repository;

import com.ex.grupoempr.empreendedorismo.model.Pais;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;


public interface PaisRepository extends JpaRepository<Pais, Long> {
    // Útil para a tela de login dos pais por e-mail
    Optional<Pais> findByEmail(String email);
}