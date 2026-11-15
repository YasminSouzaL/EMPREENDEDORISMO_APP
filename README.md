# Enigma

Dois sites React independentes compartilham a API Spring:

- `frontend/admin`: Portal Enigma, para administração, professores e responsáveis.
- `frontend/student`: ava.enigma, para atividades e conquistas dos estudantes.
- `backend`: autenticação, vínculos escolares, aprendizagem e gamificação.

## Executar os sites

Use Node.js 22.12+ e instale as dependências na raiz dos workspaces:

```powershell
cd frontend
npm ci
npm run dev:admin
```

Em outro terminal, no mesmo diretório, execute `npm run dev:student`. Os endereços padrão são `http://localhost:5173` e `http://localhost:5174`. O administrativo oferece acesso de visitante com conteúdo ilustrativo. As áreas autenticadas precisam da API.

`npm run build` em `frontend` valida e compila os dois sites. Os artefatos ficam em `admin/dist` e `student/dist`.

Cada site usa `VITE_API_BASE_URL` quando a API está em outro endereço. `VITE_STUDENT_URL` no administrativo e `VITE_ADMIN_URL` no estudante configuram os links entre os sites. Nunca coloque credenciais do banco em variáveis `VITE_*`.

## Backend

Use JDK 17+ e Maven. Execute `mvn spring-boot:run` em `backend`. Sem configuração externa, a aplicação usa H2 em memória para desenvolvimento. Para Neon, configure `ENIGMA_DATABASE_URL` (JDBC), `ENIGMA_DATABASE_USER` e `ENIGMA_DATABASE_PASSWORD` no ambiente ou em `backend/.env.properties`, que é ignorado pelo Git. Configure também `ENIGMA_CORS_ORIGINS` com as origens dos dois sites.

As migrations estão em `backend/src/main/resources/db/migration`. A inicialização com Flyway aplica migrations no banco configurado. Não aponte para outra aplicação ou banco sem revisar as migrations.

## Interface e acervo

Cada site possui apenas `colors.css` e `global.css` em `src/styles`. As cores usam primitivas numeradas e tokens semânticos. O tema escuro é persistido por site. O layout administrativo é compartilhado pelos cargos; o estudante acessa outro site.

O acervo coletado contém exatamente 500 questões públicas do ENEM: 250 de matemática, 180 de linguagens e 70 de ciências da natureza. Fontes, nível, imagens e gabaritos acompanham cada registro em `backend/src/main/resources/questions/enem-500.json`. O script `scripts/collect_questions.py` documenta a coleta. Questões importadas ficam em rascunho para revisão docente; ENEM não é classificado automaticamente como conteúdo do 8º/9º ano.

## Limites e validação

Agenda, atividades antigas e identidade escolar ainda têm armazenamento local. O catálogo de disciplinas e horários é ilustrativo. Learning Analytics usa estatísticas e regras explícitas; não há interpretação por IA generativa configurada. O agendador de extras exige o backend em execução.

A revisão visual cobre desktop, celular de 390 px, temas claro/escuro e dados fictícios para os estados autenticados. Isso não substitui testes de autorização e persistência ponta a ponta no Neon. Consulte o estado de integração em `knowledges/integracao.md` antes de publicar em produção.

As convenções do projeto ficam em `AGENTS.md` e `knowledges/`.

## MVP para apresentação

O aluno encontra uma jornada com disciplinas, conteúdos do professor, atividades e simulados. As respostas ficam no backend e alimentam o Learning Analytics e o ranking dos grupos. A nota individual é `10 × acertos / questões respondidas` na disciplina e turma. A nota do grupo é a média das notas dos integrantes; quem ainda não respondeu tem nota zero. Pontos por tempo aparecem como incentivo separado.

No administrativo, publique conteúdos e questões aprovadas em **Atividades**. O Learning Analytics permite selecionar aluno e disciplina, identificar questões e habilidades com mais erros e consultar recomendações de reforço baseadas nas respostas. É uma análise por regras e estatísticas; não exige provedor de IA.

Para preparar dados fictícios em um banco de demonstração, configure `ENIGMA_DEMO_ENABLED=true` e `ENIGMA_DEMO_PASSWORD` com uma senha de pelo menos oito caracteres antes de iniciar o backend. Serão criadas as contas `admin@demo.enigma`, `professor@demo.enigma` e `aluno@demo.enigma`, todas com a senha informada. O seed não reseta uma escola já criada. A demonstração fica desabilitada por padrão.

O teste integrado `scripts/verify-mvp.mjs` usa essa escola e publica um simulado adicional. Com o backend em execução e `ENIGMA_DEMO_PASSWORD` definido, execute `node scripts/verify-mvp.mjs` na raiz. Para outra API de teste, configure `ENIGMA_TEST_API_BASE`. Execute em banco de demonstração.

Configuração de publicação e variáveis dos dois sites: [knowledges/deploy.md](knowledges/deploy.md).
