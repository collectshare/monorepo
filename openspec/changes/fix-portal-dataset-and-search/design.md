## Context

`DataTable` sempre registra `getPaginationRowModel()`. No TanStack Table, sem estado de paginação, o default é página 0 com 10 linhas.

## Goals / Non-Goals

**Goals:** o portal mostra tudo que carregou; nenhum estado de carregamento infinito.

**Non-Goals:** virtualização da tabela; trocar "Carregar mais" por paginação numerada.

## Decisions

- **Paginação opcional pelo prop existente** (`pagination` definido → modelo de paginação local) em vez de um prop novo `disablePagination`: menos API, e o significado "sem `pagination` = sem paginação" é o que o portal já supunha.
- **`useQuery` com `placeholderData: keepPreviousData`** e o debounce de 300 ms em um `useDebouncedValue` simples; remove o `setTimeout` manual.

## Risks / Trade-offs

- [Telas do web que dependiam do default 10] → listar os usos de `DataTable` e passar `pagination` explicitamente onde houver `DataTablePagination`.
