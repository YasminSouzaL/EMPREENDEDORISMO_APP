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

    private String email;
    


   

    //senha
    @NotBlank 
    private String senha;


    @ManyToOne
    @JoinColumn(name = "pais_id", nullable = false)
    private Pais pais;
    public Aluno() {
    }

    public Aluno(String nome, String matricula, String turma, Trilha trilha, String senha,Pais pais, String email) {
        this.nome = nome;
        this.matricula = matricula;
        this.turma = turma;
        this.trilha = trilha;
        this.pontos = 0;
        this.senha = senha;
        this.pais = pais;
        this.email = email;

        
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

    public Pais getPais() { return pais; }
    public void setPais(Pais pais) { this.pais = pais; }
    public String getSenha() { return senha; }
    public void setSenha(String senha) { this.senha = senha; }

    public  String getEmail(){
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}