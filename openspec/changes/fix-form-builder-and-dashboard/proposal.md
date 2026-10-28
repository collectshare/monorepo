## Why

O builder, a tela principal do produto, tem bugs que perdem trabalho: o botão "…" de cada pergunta tem `onClick={onRemove}` e **apaga a pergunta ao abrir o menu**; arrastar para reordenar nunca funciona (comparação por referência de uma cópia rasa); `useFieldArray` sobre `string[]` corrompe as opções; clonar copia o estado inicial. No dashboard, o nome de uma opção vira chave CSS injetada via `dangerouslySetInnerHTML` (XSS armazenado: qualquer respondente controla o texto de "Outro"/TEXT). Achados 2.4, 2.5, 2.6, 2.7, 2.10 (filtro e ordenação), 3.2(1), 4.2 e 4.5 (StarRating, defaultValues) do Relatório Frontend.

## What Changes

- **Builder:** remover `onClick={onRemove}` do trigger do menu; `Reorder.Item value` recebe o mesmo objeto de `fields.fields` e a reordenação usa `move(from, to)` por `id`; opções viram `{ value: string }[]` no formulário (convertidas na borda do save/load); clonar lê `form.getValues(\`fields.${index}\`)`.
- **`/forms/builder` sem `:id`:** abre o modal de detalhes para definir o título antes do primeiro save (o erro de validação aparece).
- **FormRenderer:** 404/erro de `getForm` mostra estado "formulário não encontrado" em vez de quebrar.
- **Respondente:** `FileUpload` aceita arrastar e soltar (`onDragOver`/`onDrop` com `preventDefault`); `StarRating` com botões acessíveis (teclado, `aria-label`); `useFormController` com `defaultValues` para as mensagens configuradas aparecerem em vez de "Required".
- **Dashboard:** chave do `chartConfig` gerada por índice (`option-0`, …) e o nome real só no `label`; `ChartStyle` sanitiza a chave (`[^a-zA-Z0-9-_]`); filtro `containsAll` com seleção vazia não filtra nada de propósito, mas é ignorado (não conta como ativo); `MyForms` ordena por `createdAt`.

## Capabilities

### New Capabilities
- `form-builder`: edição, reordenação e clonagem de perguntas e renderização do formulário ao respondente.
- `form-dashboard`: gráficos e filtros das respostas do dono.

### Modified Capabilities
<!-- nenhuma -->

## Impact

- `apps/web`: `FormBuilder/index.tsx`, `useFormBuilderController.ts`, `components/FieldItem.tsx`, `components/FieldOptions.tsx`, `FormRenderer/index.tsx`, `app/hooks/useFormController.ts`, `components/ui/FileUpload.tsx`, `components/ui/StarRating.tsx`, `components/ui/chart.tsx`, `FormDashboard/components/Chart.tsx`, `PieChart.tsx`, `filters/applyFilters.ts`, `MyForms/components/FormsTable/columns.tsx`.
- Sem mudança de API. Sem dependência nova.
- Duplicação `FormResponse/FormField` × `SinglePageForm/FormField`: fora daqui (só unificar quando um bug precisar ser corrigido nos dois).
