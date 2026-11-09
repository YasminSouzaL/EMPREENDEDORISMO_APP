# Integração do Portal Enigma

O Spring atual expõe `GET /alunos`, `POST /alunos` e `GET /trilhas`. O cadastro de aluno recebe `nome`, `matricula`, `turma` e `trilhaId`. A base é compartilhada e a API não envia presença online. Use dados fictícios. O mapa associa alunos pelo rótulo da turma e informa quando a presença está indisponível.

Em desenvolvimento, o Vite encaminha `/api` para `http://localhost:8080` e remove o prefixo. Em outro ambiente, configure um proxy equivalente ou `VITE_API_BASE_URL` com CORS compatível.

O modo visitante usa o mesmo layout administrativo, com catálogo ilustrativo e calendário de consulta. A escolha fica na aba. Esse modo não gera token, não consulta a API privada e não carrega a agenda ou as atividades de uma escola.

## Contratos pendentes no Spring

O formulário é único e envia e-mail e senha ao servidor. O token fica na sessão da aba. Para abrir as rotas administrativas, o frontend valida o token consultando o perfil e aplica o cargo e os vínculos retornados. Todos os cargos usam o mesmo layout. O backend deve autorizar cada requisição e filtrar os dados pelo vínculo do usuário e pela escola.

| Rota | Contrato esperado pelo frontend |
| --- | --- |
| `POST /auth/login` | Recebe `email` e `password`. Retorna `{ accessToken }`. Credenciais inválidas retornam 401. |
| `GET /auth/me` | Recebe `Authorization: Bearer <token>`. Retorna `{ member, school }`. Sessão inválida retorna 401. |
| `POST /escolas` | Recebe `schoolName`, `name`, `email` e `password`. Após 2xx, a interface apresenta o login. |
| `GET /integrantes` | Retorna a lista de profissionais da escola autorizada para o token. |
| `POST /integrantes` e `PATCH /integrantes/:id` | Recebem `name`, `email`, `role`, `courseIds`, `classIds` e `password` quando informada. Retornam o profissional salvo. |

`member` inclui `id`, `schoolId`, `name`, `email`, `role`, `courseIds` e `classIds`. Os cargos são `admin`, `director`, `teacher` e `staff`. `school` inclui `id`, `name`, `accent` e `logo`. IDs e vínculos são strings. Use os IDs do catálogo acadêmico no protótipo.

Agenda, atividades e personalização da identidade ficam no navegador por escola. A autenticação e os vínculos não usam contas ou perfis simulados no frontend.

## Teste local no Windows

- Se o Tomcat falhar com `Unable to establish loopback connection` ao rodar pelo Codex, aponte `jdk.net.unixdomain.tmpdir` para um diretório existente e gravável fora de `AppData`, como `backend/target`. Defina a opção em `JAVA_TOOL_OPTIONS` apenas no terminal do teste. [Relato do problema](https://github.com/openai/codex/issues/40902)
