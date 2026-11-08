package com.ex.grupoempr.empreendedorismo.config;
import com.ex.grupoempr.empreendedorismo.model.Trilha;
import com.ex.grupoempr.empreendedorismo.repository.TrilhaRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataLoader {

    @Bean
    CommandLineRunner carregarDados(TrilhaRepository trilhaRepository) {
        return args -> {

            if (trilhaRepository.count() == 0) {

                trilhaRepository.save(
                        new Trilha("Lógica de programação com matemática"));

                trilhaRepository.save(
                        new Trilha("Conceitos de português com algoritmos"));
            }
        };
    }
}