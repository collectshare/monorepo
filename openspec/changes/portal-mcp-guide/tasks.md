## 1. Página

- [x] 1.1 Criar `apps/portal/src/views/pages/McpGuide/content.ts` com `MCP_URL` (`VITE_API_URL` + `/mcp`), `clients` (claude.ai/Desktop, Claude Code, Cursor) e `tools` (as 8 ferramentas do `ToolRegistry`, com `kind`)
- [x] 1.2 Criar componente local `CopyBlock` (`<pre>` com rolagem interna + botão Copiar/Copiado via `navigator.clipboard`)
- [x] 1.3 Criar `McpGuide/index.tsx`: introdução, pré-requisito com link para `VITE_WEB_APP_URL`, URL copiável, abas por cliente (ARIA como em `/sobre`), seção de login, aviso de segurança, lista de ferramentas e exemplos de pedidos

## 2. Navegação

- [x] 2.1 Registrar a rota `/mcp` em `apps/portal/src/app/router/index.tsx`
- [x] 2.2 Adicionar link "Conectar IA" no header do `PortalLayout`
- [x] 2.3 Adicionar link para `/mcp` na aba MCP de `About/content.ts`/`About/index.tsx`

## 3. Documentação

- [x] 3.1 `CLAUDE.md`: rota `/mcp` na arquitetura do portal e nota para manter `McpGuide/content.ts` em sincronia com o `ToolRegistry`
- [x] 3.2 `README.md` e `README.en.md`: mencionar a página

## 4. Verificação

- [x] 4.1 `pnpm --filter @monorepo/portal typecheck` e `lint`
- [x] 4.2 Conferir no `pnpm dev`: 360px sem rolagem horizontal, tema escuro, abas e copiar por teclado
