# Publicação do MVP

## Vercel

Publique dois projetos do mesmo repositório. Use Node.js 22 e preserve o acesso aos arquivos fora da raiz do projeto para que o npm resolva os workspaces e o lockfile em `frontend/`.

| Configuração | Administrativo | Aluno |
| --- | --- | --- |
| Root Directory | `frontend/admin` | `frontend/student` |
| Framework | Vite | Vite |
| Build Command | `npm run build` | `npm run build` |
| Output Directory | `dist` | `dist` |
| `VITE_API_BASE_URL` | `https://empreendedorismo-app.onrender.com` | `https://empreendedorismo-app.onrender.com` |
| Link entre sites | `VITE_STUDENT_URL`: URL pública do aluno | `VITE_ADMIN_URL`: URL pública do administrativo |

Configure as variáveis em Production e Preview antes de compilar. Os dois `.env.production` versionados contêm apenas a URL pública da API como padrão de build; variáveis configuradas na Vercel têm precedência. Variáveis `VITE_*` são públicas e entram no bundle durante o build; alterações exigem novo deploy. Nunca inclua credenciais do Neon nessas variáveis. Os arquivos `vercel.json` de cada site permitem abrir diretamente as rotas do React.

## Render e Neon

O backend existente está em `https://empreendedorismo-app.onrender.com`. Ele precisa executar o código de `backend/`, incluindo os controladores novos e as migrations, para atender os sites atuais.

- Build com o Dockerfile em `backend/Dockerfile`, contexto `backend/`, JDK 17.
- `ENIGMA_DATABASE_URL`: URL JDBC direta do banco Neon `enigma`, com `sslmode=require`. Formato: `jdbc:postgresql://HOST/enigma?sslmode=require`.
- `ENIGMA_DATABASE_USER` e `ENIGMA_DATABASE_PASSWORD`: credenciais do Neon, mantidas apenas no ambiente do Render.
- `ENIGMA_CORS_ORIGINS`: origens HTTPS exatas dos dois sites, separadas por vírgula e sem barra final. Para testar previews, acrescente a origem específica.
- `PORT`: fornecida pelo Render; a aplicação já a utiliza.

Flyway aplica as migrations ao iniciar. Valide uma nova migration primeiro em uma branch Neon separada. H2 em memória é apenas a opção local; iniciar o Render sem as três variáveis do Neon perde persistência ao reiniciar.

## Verificação

1. Execute `npm ci` e `npm run build` em `frontend/`.
2. Execute `./mvnw.cmd test` em `backend/` no Windows.
3. Confira que `GET /auth/me` sem token retorna 401. Retorno 404 indica backend antigo.
4. Cadastre a escola, alunos e convites. Entre como professor e publique conteúdo e uma atividade com questões aprovadas.
5. Entre como aluno, abra a disciplina e responda à atividade. Confira a nota do grupo, o ranking e as evidências no Learning Analytics do professor.
6. Reabra as páginas para verificar persistência no Neon e confira os fluxos em tela pequena.
