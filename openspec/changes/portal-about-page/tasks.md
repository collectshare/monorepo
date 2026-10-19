## 1. Conteúdo

- [x] 1.1 Criar `apps/portal/src/views/pages/About/content.ts` com o array `steps` (5 passos: RESP, API, DB, STREAM, ENGINE) e o array `doors` (OWNER, PORTAL, V1, MCP), com textos em pt-BR e a linha de exemplo bruta/anonimizada
- [x] 1.2 Conferir os textos contra o código: rota `POST /forms/{formId}/submissions`, campos do Algolia em `AlgoliaGateway.upsertRecord`, rotas `/v1` e regra do `AnonymizationEngine.resolve()`

## 2. Página

- [x] 2.1 Criar `apps/portal/src/views/pages/About/index.tsx`: título, introdução curta, stepper (`aria-current="step"`), card do passo atual e botões Anterior/Próximo
- [x] 2.2 No passo ENGINE, renderizar as quatro abas (`role="tablist"`/`role="tab"`/`aria-selected`) com autenticação, linha de exemplo e "como acessar" (link `/api-docs`, comando `claude mcp add` com `VITE_API_URL`, link para `VITE_WEB_APP_URL`)
- [x] 2.3 Layout responsivo (stepper com quebra ou rolagem própria no celular, sem rolagem horizontal da página) e só tokens do tema, sem cores fixas

## 3. Integração

- [x] 3.1 Adicionar a rota `/sobre` em `apps/portal/src/app/router/index.tsx` (import direto, sem lazy)
- [x] 3.2 Adicionar o link "Como funciona" no header de `PortalLayout`

## 4. Verificação e docs

- [x] 4.1 `pnpm --filter @monorepo/portal typecheck` e `lint` passando
- [x] 4.2 Conferir no `pnpm dev`: acesso direto a `/sobre`, navegação por teclado, tema escuro e largura de 375px
- [x] 4.3 Atualizar `CLAUDE.md` (Portal Architecture: rota `/sobre`, conteúdo alinhado com `docs/visao-geral.md`), `README.md` e `README.en.md`
