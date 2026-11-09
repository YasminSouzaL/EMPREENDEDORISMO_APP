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

Em outro terminal, abra `backend/` e inicie o Spring em `localhost:8080`:

```powershell
.\mvnw.cmd spring-boot:run
```

Com o Maven já instalado, também é possível executar `mvn spring-boot:run`. Aponte `JAVA_HOME` para o diretório do JDK se o Maven solicitar essa configuração.

A integração reutiliza a lista de alunos, o cadastro de alunos e a lista de trilhas. O Vite encaminha essas chamadas pelo prefixo `/api`. Use `VITE_API_BASE_URL` no build se a API estiver em outro endereço. Em uma hospedagem estática, configure também o fallback das rotas para `index.html`.

## Verificar

Em `frontend/`, execute `npm run build` para verificar tipos e gerar `dist/`. Use `npm run preview` para servir esse build localmente.

## Escopo do protótipo

A agenda, as atividades e a personalização da identidade escolar usam armazenamento do navegador. O cargo e os vínculos vêm da API de sessão e controlam o conteúdo exibido no layout administrativo compartilhado. O catálogo de disciplinas, séries, turmas e horários é ilustrativo. A API atual tem uma base de alunos compartilhada e não fornece presença online, autenticação ou isolamento entre escolas. Use dados fictícios.

As convenções do projeto estão em [AGENTS.md](AGENTS.md) e [knowledges](knowledges/).
