## Why

Feedback de usuário: a descrição do formulário perde as quebras de linha ao ser exibida — o texto digitado em parágrafos vira um bloco só, e links aparecem como texto cru. Hoje a descrição é renderizada como `{description}` dentro de um `<p>`, então qualquer formatação some.

## What Changes

- O usuário escolhe o **alinhamento** da descrição inteira (esquerda/centro/direita) no editor; novo campo opcional `descriptionAlign` no `Form` (ausente = centro, como hoje). Listas seguem o alinhamento do texto.
- A descrição do formulário passa a aceitar **Markdown** (subconjunto: parágrafos, quebras de linha, **negrito**, *itálico*, links, listas). O campo continua sendo uma `string`.
- Novo componente compartilhado `RichText` em `packages/ui` que renderiza Markdown com segurança (HTML cru ignorado, links externos com `target="_blank" rel="noopener noreferrer"`, só `http(s)`/`mailto`).
- A descrição é renderizada com `RichText` nas telas de exibição: resposta do formulário (`FormResponse`, `SinglePageForm`) e página do dataset no portal.
- Listagens compactas (tabela "Meus formulários", cabeçalho de uma linha do builder, cards de busca do portal) mostram texto puro (`<RichText plain>`), truncado.
- No modal de detalhes do formulário, o `Textarea` da descrição vira um editor **Tiptap** simples (WYSIWYG) com barra mínima: negrito, itálico, link (popover com campo de URL), lista com marcadores, lista numerada e alinhamento. O editor lê e grava Markdown (`@tiptap/markdown`), então o usuário não precisa saber Markdown.
- Descrições antigas (texto puro) abrem normalmente no editor e na exibição, com as quebras de linha respeitadas — sem migração.

## Capabilities

### New Capabilities
- `form-description-rich-text`: autoria e exibição segura da descrição do formulário em Markdown.

### Modified Capabilities
<!-- nenhuma: openspec/specs só tem api-openapi-docs, que não muda -->

## Impact

- `packages/ui`: novo `RichText` + dependência `react-markdown` (+ `remark-breaks` para quebra de linha simples virar `<br>`).
- `apps/web`: novo `RichTextEditor` (deps `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/markdown`), `SaveFormDetailsModal`, `FormResponse`, `SinglePageForm`, `FormBuilder`, `MyForms/FormsTable/columns.tsx`.
- `apps/portal`: `Dataset`, `Home` (card de resultado).
- API: `descriptionAlign` em `Form`/`FormItem`, `createFormSchema`/`updateFormSchema` e use cases de criar/editar (exige deploy da API). Algolia indexa a descrição com a sintaxe Markdown — aceitável (busca semântica tolera); ver design.
- `openapi.yaml` e descrições das tools MCP `create_form`/`update_form`: mencionar que `description` aceita Markdown.
