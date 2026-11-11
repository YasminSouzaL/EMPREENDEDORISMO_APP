package com.ex.grupoempr.empreendedorismo.repository;

import com.ex.grupoempr.empreendedorismo.model.Evento;
import org.springframework.data.jpa.repository.JpaRepository;


public interface EventoRepository extends JpaRepository<Evento, Long> {
    // O JpaRepository já nos dá métodos como findAll(), save(), findById(), etc.
    // Podemos adicionar buscas por data ou ordem de proximidade depois, se
    // precisar.
}