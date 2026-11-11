package com.ex.grupoempr.empreendedorismo.repository;

import com.ex.grupoempr.empreendedorismo.model.Ocorrencia;
import org.springframework.data.jpa.repository.JpaRepository;


import java.util.List;


public interface OcorrenciaRepository extends JpaRepository<Ocorrencia, Long> {
    // Útil para buscar as ocorrências de um aluno específico (para os pais ou aluno visualizarem)
    List<Ocorrencia> findByAlunoId(Long alunoId);
}