## Context

`httpClient` (axios) só injeta o Bearer. `AuthContext` decide `signedIn` pelo localStorage e valida com `/me` uma única vez (staleTime infinito).

## Goals / Non-Goals

**Goals:** nenhum dado de A visível para B; sessão renova sozinha enquanto o refresh token vale; nenhum segredo em storage além dos tokens.

**Non-Goals:** mover tokens para cookie httpOnly (mudança de API e CORS, fica para depois); tela de gestão/revogação de grants MCP (precisa de API nova).

## Decisions

- **`queryClient.clear()`** em vez de listar chaves: impossível esquecer uma query nova.
- **Refresh com promessa compartilhada:** variável de módulo `refreshing: Promise<string> | null`; requisições que tomam 401 aguardam a mesma promessa; flag `_retry` na config evita loop. O interceptor não importa o `AuthContext`; ele emite `signout` por um callback registrado pelo provider (`setOnSessionExpired`).
- **Rota `/auth/refresh-token` fica fora do interceptor** (401 nela = sessão encerrada).
- **Revogação:** remover a promessa do texto é mais barato e honesto que construir a tela agora.

## Risks / Trade-offs

- [Refresh token roubado do localStorage continua válido] → mesmo risco de hoje; cookie httpOnly é o próximo passo.
- [Interceptor mascarar 401 legítimos de autorização] → a API usa 403 para negação após `harden-signup-and-auth`; até lá, um 401 que persiste após refresh desloga, que é o comportamento correto.
