package com.ex.grupoempr.empreendedorismo.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
public class Aluno {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Nome é obrigatório")
    private String nome;

    @NotBlank(message = "Matrícula é obrigatória")
    @Column(unique = true, nullable = false)
    private String matricula;

    @NotBlank(message = "Turma é obrigatória")
    private String turma;

    @ManyToOne
    @JoinColumn(name = "trilha_id")
    private Trilha trilha;

    private Integer pontos = 0;

    public Aluno() {
    }

    public Aluno(String nome, String matricula, String turma, Trilha trilha) {
        this.nome = nome;
        this.matricula = matricula;
        this.turma = turma;
        this.trilha = trilha;
        this.pontos = 0;
    }

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getMatricula() {
        return matricula;
    }

    public void setMatricula(String matricula) {
        this.matricula = matricula;
    }

    public String getTurma() {
        return turma;
    }

    public void setTurma(String turma) {
        this.turma = turma;
    }

    public Trilha getTrilha() {
        return trilha;
    }

    public void setTrilha(Trilha trilha) {
        this.trilha = trilha;
    }

    public Integer getPontos() {
        return pontos;
    }

    public void setPontos(Integer pontos) {
        this.pontos = pontos;
    }
}