package com.ex.grupoempr.empreendedorismo;

import com.ex.grupoempr.empreendedorismo.controller.AuthController;
import com.ex.grupoempr.empreendedorismo.model.Professor;
import com.ex.grupoempr.empreendedorismo.repository.EscolaRepository;
import com.ex.grupoempr.empreendedorismo.repository.ProfessorRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class EmpreendedorismoApplicationTests {

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Autowired
	private ProfessorRepository professorRepository;

	@Autowired
	private EscolaRepository escolaRepository;

	@Test
	void contextLoads() {
	}

	@Test
	void migrationsCreateRelationalSchemaAndSeedTwentyDemoStudents() {
		assertThat(count("SELECT COUNT(*) FROM aluno WHERE matricula LIKE 'DEMO-%'")).isEqualTo(20);
		assertThat(count("SELECT COUNT(*) FROM pais WHERE email = 'responsavel.demo@example.invalid'")).isEqualTo(1);
		assertThat(count("SELECT COUNT(*) FROM escola WHERE nome = 'Escola de demonstração'")).isEqualTo(1);
		assertThat(count("""
				SELECT COUNT(*)
				FROM aluno
				WHERE matricula LIKE 'DEMO-%' AND (pais_id IS NULL OR trilha_id IS NULL OR escola_id IS NULL)
				""")).isZero();
		assertThat(count("""
				SELECT COUNT(*)
				FROM information_schema.tables
				WHERE table_schema = 'public'
				  AND table_type = 'BASE TABLE'
				  AND table_name IN ('aluno', 'pais', 'professor', 'trilha', 'evento', 'ocorrencia', 'escola')
				""")).isEqualTo(7);
		assertThat(count("""
				SELECT COUNT(*)
				FROM information_schema.table_constraints
				WHERE constraint_schema = 'public'
				  AND constraint_type = 'FOREIGN KEY'
				  AND table_name IN ('aluno', 'professor', 'evento', 'ocorrencia')
				""")).isEqualTo(7);
	}

	@Test
	void professorCanLoginAndLoadProfile() {
		Professor professor = new Professor();
		professor.setNome("Professor de teste");
		professor.setEmail("auth-test-" + UUID.randomUUID() + "@example.invalid");
		professor.setSenha("test-password");
		professor.setEscola(escolaRepository.findAll().get(0));
		professor = professorRepository.save(professor);

		try {
			AuthController authController = new AuthController(professorRepository);
			ResponseEntity<?> invalidLogin = authController.login(java.util.Map.of(
					"email", professor.getEmail(), "password", "incorrect-password"));
			assertThat(invalidLogin.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

			ResponseEntity<?> login = authController.login(java.util.Map.of(
					"email", professor.getEmail(), "password", "test-password"));
			assertThat(login.getStatusCode()).isEqualTo(HttpStatus.OK);
			AuthController.LoginResponse loginBody = (AuthController.LoginResponse) login.getBody();
			assertThat(loginBody).isNotNull();
			assertThat(loginBody.accessToken()).isNotBlank();

			ResponseEntity<?> profile = authController.profile("Bearer " + loginBody.accessToken());
			assertThat(profile.getStatusCode()).isEqualTo(HttpStatus.OK);
			AuthController.AuthProfile profileBody = (AuthController.AuthProfile) profile.getBody();
			assertThat(profileBody).isNotNull();
			assertThat(profileBody.member().email()).isEqualTo(professor.getEmail());
			assertThat(profileBody.member().role()).isEqualTo("teacher");
			assertThat(profileBody.member().schoolId()).isEqualTo(String.valueOf(professor.getEscola().getId()));
			assertThat(profileBody.school().name()).isEqualTo(professor.getEscola().getNome());
		} finally {
			professorRepository.deleteById(professor.getId());
		}
	}

	private long count(String sql) {
		return jdbcTemplate.queryForObject(sql, Long.class);
	}
}
