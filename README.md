# Protótipo do Aplicativo Educativo

## 1. Sobre o projeto

Este repositório contém o desenvolvimento do protótipo funcional de um aplicativo educativo.

O objetivo é construir uma aplicação que utilize tecnologia para apoiar o ambiente escolar, contribuindo para o ensino e a aprendizagem.

A solução será desenvolvida considerando as necessidades identificadas junto à escola. As funcionalidades definitivas serão estabelecidas conforme a evolução do projeto.

## 2. Objetivo do protótipo

Desenvolver uma versão inicial e funcional do aplicativo, permitindo visualizar, navegar e testar suas principais telas e funcionalidades.

O protótipo não deve ser composto apenas por telas estáticas. Os elementos da interface deverão apresentar comportamentos funcionais.

## 3. Tecnologias utilizadas

### Front-end
- HTML5: estrutura das telas.
- CSS3: estilização e layout.
- JavaScript: interações, validações e comunicação com o servidor.

### Back-end
- Java: implementação da lógica da aplicação.
- Spring Boot: framework previsto para criação da API REST.

### Comunicação
- API REST.
- HTTP.
- JSON.

### Banco de dados
A tecnologia será definida conforme as funcionalidades necessárias ao protótipo.

## 4. Arquitetura

A aplicação será dividida em duas partes principais:

**Front-end:** responsável pela interface visual, navegação, formulários e interação com o usuário.

**Back-end:** responsável pelo processamento das informações, validações, regras de negócio e comunicação com o banco de dados.

O front-end realizará requisições à API desenvolvida em Java.

## 5. Requisitos do protótipo

- Interface simples e intuitiva.
- Navegação funcional entre telas.
- Botões com ações implementadas.
- Formulários com validação.
- Integração entre front-end e back-end.
- Retorno de mensagens de sucesso e erro.
- Persistência de dados quando necessária.
- Código organizado e de fácil manutenção.

## 6. Telas do aplicativo

As telas serão definidas e implementadas durante o desenvolvimento do protótipo.

Cada tela deverá possuir uma finalidade específica e estar integrada ao fluxo de navegação da aplicação.

A documentação dos fluxos e das telas ficará em `docs/telas-e-fluxos.md`.

## 7. Estrutura do repositório

```text
prototipo-app/
├── README.md
├── frontend/
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── pages/
├── backend/
│   ├── pom.xml
│   └── src/
└── docs/
    └── telas-e-fluxos.md
```

## 8. Como executar

### Front-end

1. Acesse a pasta `frontend`.
2. Abra o arquivo `index.html` em um navegador ou utilize a extensão Live Server do VS Code.

### Back-end

1. Acesse a pasta `backend`.
2. Execute o projeto Spring Boot.
3. Verifique se a API está disponível.
4. Configure a URL da API no front-end.

Os comandos definitivos de execução serão documentados após a configuração do projeto.

## 9. Etapas de desenvolvimento

1. Definição do fluxo de navegação.
2. Criação das telas com HTML e CSS.
3. Implementação das interações com JavaScript.
4. Desenvolvimento da API em Java.
5. Integração entre front-end e back-end.
6. Implementação das funcionalidades.
7. Testes de navegação e funcionamento.
8. Ajustes e melhorias do protótipo.

## 10. Status do projeto

**Fase atual:** desenvolvimento do protótipo funcional.

As funcionalidades e telas serão atualizadas conforme o desenvolvimento e a validação da proposta.

## 11. Observação

Este repositório é destinado exclusivamente ao código-fonte, às telas, aos fluxos e à documentação técnica do protótipo.

Os questionários e materiais referentes à pesquisa com a escola são mantidos separadamente no Google Drive.