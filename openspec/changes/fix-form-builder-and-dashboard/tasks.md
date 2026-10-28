## 1. Builder

- [ ] 1.1 `FieldItem`: remover `onClick={onRemove}` do trigger do menu
- [ ] 1.2 Reorder por `id` com `move`; tirar a cópia rasa do JSX
- [ ] 1.3 Opções como `{ value }[]` no form, convertendo em load/save; teste de ida e volta
- [ ] 1.4 `cloneField` com `form.getValues`
- [ ] 1.5 `/forms/builder` sem id: abrir modal de detalhes no save quando faltar título

## 2. Respondente

- [ ] 2.1 `FormRenderer`: estado de não encontrado/erro
- [ ] 2.2 `FileUpload`: `onDragOver`/`onDrop`
- [ ] 2.3 `StarRating`: `<button type="button">` por estrela, `aria-label`, `aria-pressed`
- [ ] 2.4 `useFormController`: `defaultValues` por tipo de pergunta

## 3. Dashboard

- [ ] 3.1 `Chart`/`PieChart`: chaves por índice; `chart.tsx` sanitiza a chave
- [ ] 3.2 `applyFilters`: `containsAll` vazio inativo
- [ ] 3.3 `MyForms` `columns.tsx`: `accessorKey: 'createdAt'`

## 4. Verificação

- [ ] 4.1 `pnpm --filter @monorepo/web typecheck && pnpm --filter @monorepo/web lint && pnpm --filter @monorepo/web test`
- [ ] 4.2 Manual: abrir menu, arrastar, clonar, criar form novo, responder com drop de arquivo e teclado, opção maliciosa no gráfico
