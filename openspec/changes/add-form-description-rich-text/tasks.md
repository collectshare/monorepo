## 1. Componente compartilhado

- [x] 1.1 Adicionar `react-markdown` e `remark-breaks` em `packages/ui`
- [x] 1.2 Criar `RichText` (`packages/ui/src/components/RichText.tsx`): `allowedElements` p/br/strong/em/a/ul/ol/li, `unwrapDisallowed`, `urlTransform` só http(s)/mailto, `<a target="_blank" rel="noopener noreferrer">`, estilos Tailwind para listas/links/parágrafos
- [x] 1.3 Modo `plain` no `RichText` para listagens (substitui o `stripMarkdown` por regex) e exportar no index do pacote
- [x] 1.4 Teste mínimo: `<script>`/`onerror` não geram elementos, `javascript:` é descartado, `\n` vira `<br>`, modo `plain` resolve entidades/escapes

## 2. Web

- [x] 2.1 Adicionar `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/markdown` (`3.31.4`) em `apps/web`
- [x] 2.2 Criar `apps/web/src/components/RichTextEditor` (StarterKit reduzido + Link restrito a http(s)/mailto, `Markdown` com `markedOptions.breaks`, barra com negrito/itálico/link/listas)
- [x] 2.3 `SaveFormDetailsModal`: trocar o `Textarea` da descrição pelo `RichTextEditor` via `Controller`
- [x] 2.4 Teste: texto antigo "Linha 1\nLinha 2" carregado no editor e salvo sem mudanças continua renderizando duas linhas no `RichText`
- [x] 2.5 Trocar `<p>{description}</p>` por `RichText` em `FormResponse` e `SinglePageForm`; `FormBuilder` (cabeçalho truncado) usa `<RichText plain>`
- [x] 2.6 `MyForms/FormsTable/columns.tsx`: exibir `<RichText plain>` truncado

## 3. Portal

- [x] 3.1 `Dataset`: renderizar descrição com `RichText`
- [x] 3.2 `Home`: `CardDescription` com `<RichText plain>`

## 4. Contratos e docs

- [x] 4.1 `apps/portal/public/openapi.yaml`: `description` do form "aceita Markdown"
- [x] 4.2 Descrições das tools MCP `create_form`/`update_form`: mencionar Markdown
- [x] 4.3 Atualizar `README.md`/`README.en.md`/`CLAUDE.md` se mencionarem a descrição

## 5. Ajustes do teste manual

- [x] 5.1 Link por popover (`Popover` + `Input`) no lugar de `window.prompt`
- [x] 5.2 `descriptionAlign` em `Form`, `FormItem`, schemas de criar/editar, use cases (update omitido = mantém), `save.ts`, modal e OpenAPI; teste no `UpdateFormDetailsUseCase.test.ts`
- [x] 5.3 Botões de alinhamento no editor; `RichText align` nas telas de resposta; listas acompanham o alinhamento
- [ ] 5.4 Deploy da API em dev para o alinhamento persistir

## 6. Verificação

- [x] 6.1 `pnpm typecheck` e `pnpm lint` em web, portal e ui; `pnpm build` na raiz
- [ ] 6.2 Manual: criar form pelo editor com quebras, negrito, link e listas; editar um form antigo de texto puro; colar `<script>`; conferir resposta, builder, portal e listagens
