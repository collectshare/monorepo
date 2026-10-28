## 1. DataTable

- [ ] 1.1 `DataTable`: `getPaginationRowModel` só quando `pagination` for passado
- [ ] 1.2 Revisar usos no web (`grep -rn "<DataTable" apps`) e passar `pagination` onde há `DataTablePagination`

## 2. Portal

- [ ] 2.1 `useHomeController` com `useQuery` + debounce; erro e retry na Home
- [ ] 2.2 Rota `*` com página 404; `fallback` no `Suspense` de `/api-docs`; ErrorBoundary na raiz

## 3. Verificação

- [ ] 3.1 `pnpm --filter @monorepo/portal typecheck && pnpm --filter @monorepo/portal lint`; `pnpm --filter @monorepo/web typecheck`
- [ ] 3.2 Manual: dataset com > 20 linhas, "Carregar mais", API desligada na busca, rota inexistente
