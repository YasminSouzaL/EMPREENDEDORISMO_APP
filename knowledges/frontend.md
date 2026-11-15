# Frontend

- Dois sites independentes: `frontend/admin` (Portal Enigma) e `frontend/student` (ava.enigma). A raiz `frontend` gerencia os workspaces npm.
- Execute `npm install` em `frontend`, `npm run dev:admin` para administração e `npm run dev:student` para estudantes. O build da raiz compila os dois sites.
- Cada `src/styles` contém somente `colors.css` e `global.css`. Primitivos numerados alimentam tokens semânticos e o atributo `data-theme` seleciona o tema escuro.
- O estudante não usa as rotas administrativas. `VITE_STUDENT_URL` e `VITE_ADMIN_URL` configuram os links entre os sites. Não transporte tokens pela URL.
- O estudante usa tema claro por padrão, cores vibrantes e cartões arredondados. Jornada, disciplinas, conteúdos, atividades, equipes e ranking usam os contratos `/student/*`; não replique dados privados em mocks de produção.
- Conteúdos e atividades publicados pelo professor usam `/teaching/*`. Os rascunhos locais antigos ficam identificados como não publicados.
- O acervo público fica no backend. Importações são rascunhos; preservam fonte, nível e imagens. Não classifique automaticamente ENEM como 8º/9º ano.

- Vite 8, React, TypeScript estrito, React Router, Tailwind CSS e Evergreen UI.
- Organize componentes genéricos em `atoms`, `molecules` e `organisms`. Extraia componentes reutilizados em mais de quatro lugares. Exporte os componentes de cada nível pelo seu `index.ts`.
- Organize telas em `src/app`, chamadas HTTP em `src/api`, estado compartilhado em `src/context` e hooks reutilizáveis para domínios complexos em `src/hook`.
- Importe pelos aliases `@app`, `@api`, `@assets`, `@context`, `@hook`, `@components`, `@atoms`, `@molecules`, `@organisms` e `@styles`. Use `@/types/...` para tipos.
- Use Tailwind para layout, espaçamento e aparência. Exponha os tokens da paleta em `src/styles/colors.css` e mantenha as configurações globais em `src/styles/global.css`. Use o mesmo layout administrativo para todos os cargos. A grade usa múltiplos de 4 px, com cantos de 3 px e barra de rolagem fina em `#fcd4a0`.
- As rotas privadas carregam sob demanda. Preserve rótulos de formulário, navegação por teclado e mensagens de erro visíveis.
- Rode `npm run build` em `frontend/` para validar tipos e o bundle de produção.
