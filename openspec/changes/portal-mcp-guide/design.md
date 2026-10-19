## Context

O servidor MCP (`POST /mcp`) e o authorization server OAuth já estão em produção no `apps/api`; o consentimento é a página `/oauth/authorize` do `apps/web`. O portal é público, em pt-BR, e já usa `VITE_API_URL` (Scalar e aba MCP de `/sobre`) e `VITE_WEB_APP_URL` (botão "Entrar"). A página `/sobre` já resolveu abas com `Button` do `@monorepo/ui` e ARIA manual, e conteúdo num `content.ts` ao lado da página.

## Goals / Non-Goals

**Goals:**
- Um usuário com conta consegue conectar o Collectshare no cliente de IA que usa sem ler o repositório.
- Deixar claro o que o agente pode fazer e o risco de conectar.
- Zero dependências novas, zero mudanças fora de `apps/portal` (além de documentação).

**Non-Goals:**
- Testar a conexão a partir da página (chamar `/mcp` ou `/.well-known/...`).
- Capturas de tela dos clientes (desatualizam rápido; texto basta).
- Tela de gestão/revogação de grants (é do `apps/web`, ainda não existe).
- Outros clientes além de claude.ai/Desktop, Claude Code e Cursor.

## Decisions

**Rota `/mcp` no portal.** Curta e é o nome que aparece no comando. Não conflita com a API, que está em outro domínio. Alternativa: `/conectar-ia` — mais amigável, mas o termo "MCP" é o que o usuário vai procurar.

**Conteúdo em `McpGuide/content.ts`.** `clients: { id, label, steps: string[], code?: string }[]` e `tools: { name, description, kind: 'read' | 'write' | 'destructive' }[]`, como em `About/content.ts`. A lista de ferramentas espelha o `ToolRegistry`; uma linha no `CLAUDE.md` lembra de atualizar as duas juntas. Alternativa: buscar `tools/list` da API — exige token, descartado.

**Abas reaproveitando o padrão de `/sobre`.** Mesmo markup (`role="tablist"`, `Button` com `variant` alternando). Se aparecer um terceiro uso, aí extrai um `Tabs` para `@monorepo/ui`.

**Botão de copiar com `navigator.clipboard.writeText`.** Um componente local `CopyBlock` (`<pre>` com `overflow-x-auto` + botão) usado para URL, comando e JSON. Estado "Copiado" por 2s com `setTimeout`. Sem fallback para `execCommand`: o portal é servido em HTTPS e `localhost` também é contexto seguro.

**Sem lazy-load.** Texto e componentes leves; importação direta no router.

**Ícones de `lucide-react`** (já dependência do portal) para copiar/copiado e aviso.

## Risks / Trade-offs

- [UI dos clientes muda e os passos desatualizam] → passos descritos em termos genéricos ("Configurações → Conectores → Adicionar conector personalizado"), sem screenshots.
- [Lista de ferramentas diverge do `ToolRegistry`] → nota no `CLAUDE.md`; são 8 itens, revisão manual.
- [`VITE_API_URL` vazia em build mal configurado] → a URL ficaria `/mcp`; mesmo risco que o Scalar já tem, sem tratamento extra.
- [Conector personalizado no claude.ai depende do plano do usuário] → a página diz que a opção pode não estar disponível em todos os planos.
