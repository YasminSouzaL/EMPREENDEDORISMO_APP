package com.ex.grupoempr.empreendedorismo.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

@Entity
@Table(name = "pais")
public class Pais {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Nome é obrigatório")
    private String nome;

    @NotBlank(message = "Email é obrigatório")
    @Email(message = "Email inválido")
    @Column(unique = true, nullable = false)
    private String email;

    @NotBlank(message = "Senha é obrigatória")
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String senha;

    @JsonManagedReference
    @OneToMany(mappedBy = "pais", cascade = CascadeType.ALL)
    private List<Aluno> alunos;

    public Pais() {}

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getSenha() { return senha; }
    public void setSenha(String senha) { this.senha = senha; }
    public List<Aluno> getAlunos() { return alunos; }
    public void setAlunos(List<Aluno> alunos) { this.alunos = alunos; }
}
