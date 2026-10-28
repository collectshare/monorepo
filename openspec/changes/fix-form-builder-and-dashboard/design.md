## Context

O builder usa React Hook Form (`useFieldArray` para `fields`) + `framer-motion` `Reorder`. O dashboard usa o `chart.tsx` do shadcn, que gera um `<style>` com uma variável CSS por chave do `chartConfig`.

## Goals / Non-Goals

**Goals:** nenhuma ação de UI apaga ou corrompe perguntas sem intenção; nenhum texto de respondente vira HTML/CSS.

**Non-Goals:** redesenho do builder; unificar os dois `FormField`; testes E2E.

## Decisions

- **Reorder por id:** `Reorder.Group values={fields.fields}` e `Reorder.Item value={field}` com o mesmo objeto; `onReorder(newOrder)` calcula `from`/`to` pelo `id` e chama `move`. A normalização `options ?? []` sai do JSX e vai para o `defaultValues`.
- **Opções como objetos** porque `useFieldArray` exige objetos; converter `string[] ↔ {value}[]` só em `load`/`save` mantém API e `packages/shared` intactos.
- **Chave do gráfico por índice** resolve o XSS na origem; a sanitização no `ChartStyle` é defesa em profundidade para outros usos.
- **`containsAll` vazio**: a UI não deveria criar o filtro; `applyFilters` trata `selected.length === 0` como filtro inativo (retorna `true` para todas as linhas, mas sem ser contado no badge de filtros ativos).

## Risks / Trade-offs

- [Conversão de opções esquecida em algum caminho] → teste unitário de `load → save` preservando as opções.
