## Why

Quem chega ao Collectshare pela primeira vez (e a banca do TCC) não tem como entender, sem ler código, o que o sistema faz, onde o dado mora e por quais caminhos ele sai: web, portal, API `/v1` e MCP. O `docs/visao-geral.md` explica isso com Mermaid para quem lê o repositório. Falta uma versão interativa, pública e sem login, que mostre o mesmo percurso a um leigo e sirva de roteiro para a demo da banca.

## What Changes

- Nova rota pública `/sobre` no `apps/portal` com a página "Siga um dado".
- Stepper com 5 passos (① envio, ② API, ③ DynamoDB, ④ eventos, ⑤ leitura). Cada passo mostra o que acontece, onde o dado está e como ele está, sempre com a mesma resposta de exemplo (`Maria Silva`, `CPF 123.456.789-00`, `CEP 89010-000`).
- No passo ⑤, quatro abas com as portas de saída (Dono, Portal, API `/v1`, MCP). Cada aba mostra a linha de exemplo como aquela porta a devolve e um "como acessar" (link para `/api-docs`, comando `claude mcp add`, link para o app web).
- Link "Como funciona" no header do `PortalLayout`.
- Conteúdo como um array de passos dentro da própria página, com IDs alinhados aos nós de `docs/visao-geral.md`.
- Sem dependência nova: React, Tailwind, `@monorepo/ui` e `lucide-react`.

## Capabilities

### New Capabilities
- `portal-about-page`: página pública e interativa do portal que explica o percurso de um dado no Collectshare e as quatro formas de acessá-lo.

### Modified Capabilities
<!-- nenhuma -->

## Impact

- `apps/portal`: nova página em `src/views/pages/About/`, nova rota em `src/app/router/index.tsx` e link no header (`src/views/layouts/PortalLayout/index.tsx`).
- Nenhuma mudança em `apps/api`, `apps/web`, `packages/ui` ou na infraestrutura. O CloudFront do portal já serve `index.html` para rotas do SPA (assim como `/api-docs`).
- Documentação: `README.md` / `README.en.md` e `CLAUDE.md` (seção do portal) ganham a nova rota.
