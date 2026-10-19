## Why

O Collectshare já tem um servidor MCP (`POST /mcp`) com login OAuth, mas o único lugar que explica como conectá-lo é o `CLAUDE.md` e uma linha na aba "MCP" da página `/sobre`. Um usuário comum (ou a banca do TCC) não sabe qual URL colar, em qual tela do claude.ai, o que acontece no consentimento nem o que pode pedir ao agente depois. Falta um guia público, passo a passo, no portal.

## What Changes

- Nova rota pública `/mcp` no `apps/portal` com a página "Use o Collectshare no Claude".
- Pré-requisito: ter conta no app web (link "Criar conta" via `VITE_WEB_APP_URL`).
- URL do servidor (`VITE_API_URL` + `/mcp`) em destaque, com botão de copiar.
- Instruções por cliente, em abas: **claude.ai / Claude Desktop** (conector personalizado), **Claude Code** (`claude mcp add --transport http collectshare <url>` e `/mcp` para autenticar) e **Cursor** (`mcp.json` com `url`). Cada aba termina no mesmo fluxo de consentimento.
- Seção "O que acontece no login": tela `/oauth/authorize` do app web, Autorizar/Cancelar, o agente age como o dono.
- Lista das 8 ferramentas (nome, o que faz, se é somente leitura ou destrutiva) e exemplos de pedidos ("liste meus formulários", "crie um formulário de satisfação com 5 perguntas"…).
- Aviso de segurança: conecte só clientes confiáveis, dados de datasets e respostas são texto de terceiros, ferramentas destrutivas pedem confirmação, ainda não há tela para revogar acessos.
- Link "Conectar IA" no header do `PortalLayout` e, na aba MCP de `/sobre`, link para `/mcp`.
- Sem dependência nova.

## Capabilities

### New Capabilities
- `portal-mcp-guide`: página pública do portal que ensina a conectar o servidor MCP do Collectshare no claude.ai, Claude Desktop, Claude Code e Cursor, e explica o login, as ferramentas e os cuidados de segurança.

### Modified Capabilities
<!-- nenhuma (portal-about-page ainda não foi arquivada; o link a partir dela é um detalhe de implementação) -->

## Impact

- `apps/portal`: nova página em `src/views/pages/McpGuide/`, rota em `src/app/router/index.tsx`, link no header (`src/views/layouts/PortalLayout/index.tsx`) e na aba MCP de `src/views/pages/About/content.ts`.
- Nenhuma mudança em `apps/api`, `apps/web`, `packages/ui` ou infraestrutura (o CloudFront já serve `index.html` para rotas do SPA).
- Documentação: `CLAUDE.md`, `README.md` e `README.en.md` ganham a rota.
