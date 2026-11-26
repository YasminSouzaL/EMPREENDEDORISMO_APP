# Portal Enigma

Protótipo de um portal de gestão escolar com site institucional e área de trabalho para administração, direção, professores e equipe.

## Executar

Use Node.js 20.19+ da linha 20 ou Node.js 22.12+ e um JDK 17 ou superior.

Em `frontend/`:

```powershell
npm ci
npm run dev
```

Abra o endereço exibido pelo Vite. Na página **Acessar portal**, escolha **Entrar como visitante** para navegar pela agenda e pelo catálogo de exemplo. Todos os cargos usam o mesmo formulário de login. A autenticação e o cadastro de escolas dependem dos endpoints pendentes descritos em [Integração](knowledges/integracao.md).

Na raiz do repositório, copie o arquivo de exemplo para `.env` (se ainda não existir), ajuste as credenciais e inicie o banco:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
docker compose up -d database
```

Em outro terminal, a partir da raiz do repositório, abra `backend/` e inicie o Spring em `localhost:8080`:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Com o Maven já instalado, também é possível executar `mvn spring-boot:run`. Aponte `JAVA_HOME` para o diretório do JDK se o Maven solicitar essa configuração.

A integração reutiliza a lista de alunos, o cadastro de alunos e a lista de trilhas. O Vite encaminha essas chamadas pelo prefixo `/api`. Use `VITE_API_BASE_URL` no build se a API estiver em outro endereço. Em uma hospedagem estática, configure também o fallback das rotas para `index.html`.
No servidor de desenvolvimento, `VITE_API_PROXY_TARGET` altera o destino do proxy `/api` (padrão `http://localhost:8080`); por exemplo, use `http://localhost:8081` se a porta 8080 estiver ocupada.

O PostgreSQL 18 é configurado pelo arquivo `.env` na raiz. Copie `.env.example` para `.env` e ajuste as credenciais antes de iniciar o banco. O volume Docker `postgres18_data` preserva os dados. Ao iniciar o backend, o Flyway aplica as migrations em `backend/src/main/resources/db/migration`; a primeira carga cria as tabelas relacionais e 20 alunos fictícios associados à Escola de demonstração. O `.env` não deve ser commitado.

## Verificar

Em `frontend/`, execute `npm run build` para verificar tipos e gerar `dist/`. Use `npm run preview` para servir esse build localmente.

## Escopo do protótipo

A agenda, as atividades e a personalização da identidade escolar usam armazenamento do navegador. O cargo e os vínculos vêm da API de sessão e controlam o conteúdo exibido no layout administrativo compartilhado. O catálogo de disciplinas, séries, turmas e horários é ilustrativo. A API atual tem uma base de alunos compartilhada e não fornece presença online, autenticação ou isolamento entre escolas. Use dados fictícios.

As convenções do projeto estão em [AGENTS.md](AGENTS.md) e [knowledges](knowledges/).
