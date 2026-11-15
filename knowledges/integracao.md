# Estado atual da integração

- Os sites estão separados em `frontend/admin` e `frontend/student`.
- O backend recebeu implementações dos contratos de autenticação, responsáveis, convites, aprendizagem, gamificação e atividades extras. Os trechos históricos abaixo descrevem a base anterior e não são a referência para as novas rotas.
- O projeto Neon `portal-enigma` tem ID `odd-bread-35548888`, banco `enigma`. V1 e V2 foram aplicadas e validadas na branch `mvp-validation-20261114` e depois aplicadas no banco principal. O fluxo real de publicação, resposta, persistência e ranking passou na branch de validação; a escola fictícia permanece somente nela. Credenciais locais ficam fora do Git. Isso não constitui uma auditoria completa de isolamento e concorrência.
- As novas telas não simulam sucesso quando a API está indisponível. Os testes visuais usam respostas fictícias restritas à automação de QA.
- O acervo público contém 500 questões, todas identificadas como ENEM. A revisão docente deve preceder a publicação para estudantes.
- Os frontends foram publicados na Vercel em `enigma-admin-eight.vercel.app` e `enigma-student.vercel.app`, com build aprovado e resposta HTTP 200. A atualização automática por GitHub está pendente do acesso ao repositório privado. O backend remoto precisa executar as rotas desta branch para o fluxo autenticado; a validação integrada usou a API local conectada ao Neon. Não há serviço de IA generativa configurado.
- Conteúdos docentes usam CRUD em `/teaching/contents`; atividades e simulados são publicados em `/teaching/activities`, com edição de título/prazo e arquivamento que preserva as evidências.
- O aluno consulta `/student/courses`, `/student/activities`, `/student/groups` e `/student/ranking`. Somente integrantes podem renomear seu grupo. A média acadêmica do grupo é a média das notas individuais de 0 a 10, calculadas de todos os acertos da disciplina/turma; integrantes sem respostas têm zero.
- Cada resposta registra questão, conteúdo, habilidade, acerto e tempo em `learning.results`. O Analytics administrativo agrega as evidências por aluno, disciplina, questão e habilidade e oferece recomendações por regras. Resultados agregados antigos contribuem para áreas, sem atribuir erros a questões individuais.
- O login administrativo não exibe a máquina Enigma. O aluno usa visual claro, vibrante e arredondado. Os dois builds de produção usam a API pública do Render por padrão; consulte `deploy.md` para configurar os projetos e o CORS.
- A escola demonstrativa é opcional e exige `ENIGMA_DEMO_ENABLED=true` e senha explícita. O seed não altera uma escola demonstrativa já existente.
- Validação do MVP: build conjunto aprovado, sete testes de Analytics/ranking no frontend e cinco testes no backend (contexto e quatro fluxos). CORS DELETE foi conferido por HTTP. O navegador validou login, disciplina com conteúdo, resposta corrigida e Analytics com as evidências persistidas.

## Histórico da base inicial

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
