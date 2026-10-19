## Context

O portal tem três rotas (`/`, `/dataset/:formId` e `/api-docs`, esta com lazy-load por causa do Scalar), todas dentro do `PortalLayout`. O `@monorepo/ui` oferece `Button`, `buttonVariants`, `Card`, `Badge` e `Separator`, mas não tem componente de abas nem de stepper. O conteúdo explicativo já existe em `docs/visao-geral.md` (três diagramas Mermaid com IDs estáveis). Públicos: leigos e a banca do TCC, em projeção.

## Goals / Non-Goals

**Goals:**
- Mostrar o percurso de uma resposta e as quatro portas de leitura de forma que um leigo entenda em poucos minutos.
- Servir de roteiro para a demo da banca.
- Zero dependências novas e zero mudanças fora de `apps/portal` (além de documentação).

**Non-Goals:**
- Mermaid ou qualquer biblioteca de diagrama na tela.
- Diagrama de sequência do OAuth (fica em `docs/visao-geral.md`).
- Conteúdo vindo de CMS, JSON externo ou da API.
- Dados reais: a linha de exemplo é fixa.
- Internacionalização (o portal é só em pt-BR).

## Decisions

**Tela feita à mão em vez de Mermaid.** Um stepper de cards se ajusta bem ao celular, usa os tokens do tema (dark mode sem configuração) e não traz cerca de 1 MB de dependência. Alternativa considerada: renderizar o Mermaid com `click` nos nós. Ela foi descartada por exigir tema próprio e ficar ruim em telas estreitas. O Mermaid continua sendo a fonte para o repositório e o texto do TCC.

**Conteúdo num array tipado dentro de `About/`.** `steps: { id, title, what, where, value }[]` e `doors: { id, label, auth, row, howTo }[]` ficam num `content.ts` ao lado da página. Os `id`s seguem os nós de `docs/visao-geral.md` (`RESP`, `API`, `DB`, `STREAM`, `ENGINE`, `OWNER`, `PORTAL`, `V1`, `MCP`). Alternativa considerada: um JSON compartilhado com a documentação. Foi descartada porque só existe um consumidor.

**Estado local simples.** `useState` para o passo atual e para a aba atual. Sem sincronizar com a URL; se a demo precisar de link direto para um passo, um `?passo=` pode ser adicionado depois.

**Abas e stepper com `Button` do `@monorepo/ui` e ARIA manual.** Abas com `role="tablist"`/`role="tab"`/`aria-selected` e stepper com `aria-current="step"`. Não vale criar um componente `Tabs` no pacote compartilhado para um único uso.

**Sem lazy-load.** A página é texto e alguns componentes leves, ao contrário do Scalar. Importação direta no router.

**Valores de exemplo coerentes com o código.** Portal e `/v1/portal`: nome pseudonimizado (hash HMAC truncado), CPF suprimido, CEP generalizado para UF. Isso pressupõe um formulário de exemplo com `piiStrategy` configurado dessa forma, o que deve ser dito na própria página ("neste exemplo, o dono escolheu…"). Assim o texto não sugere que essas são as regras padrão.

**URL do MCP.** O comando `claude mcp add` usa `VITE_API_URL` + `/mcp`, a mesma variável que o Scalar já usa.

## Risks / Trade-offs

- [Texto desatualiza quando o sistema mudar] → os IDs alinhados com `docs/visao-geral.md` e uma linha no `CLAUDE.md` indicando que as duas fontes andam juntas.
- [Valores de exemplo inventados divergem da demo real] → substituir pelo resultado do formulário sintético da avaliação (`docs/tcc3-plano.md`, seção 3) antes da banca.
- [Leigo confundir "MCP vê dado bruto" com vazamento] → a aba MCP explica o consentimento OAuth e que o acesso é o do próprio dono.
- [`isPublished` com default `true`] → a página diz o que acontece hoje. Se o default mudar, o texto do passo ④ muda junto.
