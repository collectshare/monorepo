## Why

O portal é a vitrine pública dos dados abertos, e a tabela de um dataset mostra **só as 10 primeiras linhas**: o `DataTable` do `@monorepo/ui` liga `getPaginationRowModel()` com `pageSize` 10, e a página usa paginação por cursor ("Carregar mais") sem a paginação local. Carregar mais busca dados que nunca aparecem. A busca também não trata erro (fica "Buscando..." para sempre) e não há rota 404 nem ErrorBoundary. Achados 2.8, 2.9 e 4.6 (portal) do Relatório Frontend.

## What Changes

- `DataTable` ganha `manualPagination` implícito: quando `pagination` não é passado, não aplica `getPaginationRowModel` (renderiza todas as linhas recebidas). Quem quer paginação local passa `pagination`.
- Busca da Home com `useQuery` (chave com o termo debounced), estados de erro e "tentar de novo".
- Rota `*` com página 404; `fallback` no `<Suspense>` de `/api-docs`; ErrorBoundary na raiz do portal.

## Capabilities

### New Capabilities
- `portal-dataset-browsing`: navegação pública de datasets (busca, tabela, erros).

### Modified Capabilities
<!-- nenhuma -->

## Impact

- `packages/ui/src/components/DataTable/index.tsx` (afeta web: conferir as telas que usam `DataTable` sem `pagination` — `AllResponsesTable`, `FormsTable`, `ApiKeys` — e passar `pagination` onde a paginação local é desejada).
- `apps/portal`: `Home/useHomeController.ts`, `app/router/index.tsx`, `Dataset/index.tsx`, página 404 nova.
- Sem mudança de API.
