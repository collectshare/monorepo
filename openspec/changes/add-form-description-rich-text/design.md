## Context

`description` é uma `string` opcional (`createFormSchema`/`updateFormSchema`), editada num `Textarea` em `SaveFormDetailsModal` e exibida como `{description}` em `<p>` (web: `FormResponse`, `SinglePageForm`, `FormBuilder`; portal: `Dataset`, `Home`). Não há lib de Markdown/editor no monorepo. A descrição também vai para o Algolia, `/v1` e MCP.

## Goals / Non-Goals

**Goals:** quebras de linha respeitadas; formatação básica (negrito, itálico, links, listas); zero risco de XSS; nenhuma migração.

**Non-Goals:** editor completo (títulos, cores, tabelas); imagens, tabelas, títulos; rich text nas perguntas (pode reaproveitar `RichText` depois).

## Decisions

1. **Markdown em string como formato salvo; Tiptap só como editor.** Mantém o campo, a API, `/v1`, MCP (LLMs escrevem Markdown nativamente) e dados antigos intactos. Alternativa descartada: salvar HTML/JSON do Tiptap — exigiria migração das descrições antigas, sanitização (DOMPurify) e HTML cru no `/v1`/MCP/Algolia.
2. **`react-markdown` + `remark-breaks` em `packages/ui` (`RichText`).** `react-markdown` não renderiza HTML cru por padrão (sem `rehype-raw`) e já filtra URLs inseguras via `urlTransform`; restringimos a `http(s)`/`mailto`. `allowedElements`: `p, br, strong, em, a, ul, ol, li`; `unwrapDisallowed` para o resto (títulos viram texto). `remark-breaks` faz `\n` simples virar `<br>` — é exatamente o feedback. Alternativa mínima descartada: só `whitespace-pre-line` — resolve quebras mas não links/negrito, que o pedido de "texto rico" cobre.
3. **Texto puro em listagens:** `<RichText plain>` — o mesmo parser, com componentes que só devolvem o texto e separam blocos por espaço. Alternativa descartada: `stripMarkdown` por regex — deixava `&amp;`/`&lt;` (o editor salva `&`/`<` como entidades, necessário porque o renderer ignora HTML) e quebrava escapes como `\_x\_`.
4. **Autoria: `RichTextEditor` em `apps/web/src/components/`** (só o web edita; o portal só lê, então não vai para `packages/ui`). Tiptap 3 (`@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/markdown`, versão fixa `3.31.4`):
   - `StarterKit.configure({ heading: false, code: false, codeBlock: false, blockquote: false, horizontalRule: false, strike: false, underline: false, link: { openOnClick: false, autolink: true, protocols: ['http','https','mailto'], isAllowedUri } })` — só o que o renderer aceita.
   - `Markdown.configure({ markedOptions: { breaks: true } })` + `content: value, contentType: 'markdown'`; `onUpdate` → `field.onChange(editor.getMarkdown())`. `breaks: true` faz `\n` simples virar `hardBreak` — o texto antigo abre com as mesmas quebras que o `RichText` (`remark-breaks`) mostra.
   - Barra: 5 botões (`Button` de `@monorepo/ui`, ícones `lucide-react`): negrito, itálico, link (`window.prompt` com a URL; vazio remove), lista, lista numerada. Estado ativo via `editor.isActive`.
   - Integra com react-hook-form via `Controller` (como `tags`); estilo de borda igual ao `Textarea`; `immediatelyRender: false` não é necessário (SPA).
   - Editor vazio salva `''`.
5. **Alinhamento: um valor para a descrição inteira, em `Form.descriptionAlign`.** Markdown não representa alinhamento por parágrafo; isso exigiria salvar HTML (descartado na decisão 1). Ausente = `center` (visual atual dos forms antigos); no update, omitido mantém o valor (igual às flags). Centro/direita usam `list-inside` para os marcadores acompanharem o texto. O portal (dataset) ignora o alinhamento e fica à esquerda, no layout de card.
6. **Link via popover** (`Popover` + `Input` de `@monorepo/ui`) em vez de `window.prompt`: valida o protocolo com mensagem, sem selecionar insere a URL como texto do link; o `submit` do popover para a propagação para não salvar o modal.
7. **Algolia** recebe o Markdown cru; a sintaxe residual é ruído pequeno para busca.

## Risks / Trade-offs

- Ida e volta Markdown ↔ editor pode normalizar a sintaxe (ex.: `*a*` → `_a_`, espaços) → só cosmético; o conteúdo exibido é o mesmo. Coberto por teste de ida e volta do texto antigo.
- Peso do Tiptap (~ProseMirror) → só no web e só no modal do builder; carregar o editor com `lazy()` se o bundle incomodar.
- Descrições antigas com `*` ou `_` soltos podem virar itálico → raro, aceitável.
- Peso no bundle (~react-markdown + micromark) → só nas páginas que já carregam o form; aceitável.
