# Frontend

- Vite 8, React, TypeScript estrito, React Router, Tailwind CSS e Evergreen UI.
- Organize componentes genéricos em `atoms`, `molecules` e `organisms`. Extraia componentes reutilizados em mais de quatro lugares. Exporte os componentes de cada nível pelo seu `index.ts`.
- Organize telas em `src/app`, chamadas HTTP em `src/api`, estado compartilhado em `src/context` e hooks reutilizáveis para domínios complexos em `src/hook`.
- Importe pelos aliases `@app`, `@api`, `@assets`, `@context`, `@hook`, `@components`, `@atoms`, `@molecules`, `@organisms` e `@styles`. Use `@/types/...` para tipos.
- Use Tailwind para layout, espaçamento e aparência. Exponha os tokens da paleta em `src/styles/colors.css` e mantenha as configurações globais em `src/styles/global.css`. Use o mesmo layout administrativo para todos os cargos. A grade usa múltiplos de 4 px, com cantos de 3 px e barra de rolagem fina em `#fcd4a0`.
- As rotas privadas carregam sob demanda. Preserve rótulos de formulário, navegação por teclado e mensagens de erro visíveis.
- Rode `npm run build` em `frontend/` para validar tipos e o bundle de produção.
