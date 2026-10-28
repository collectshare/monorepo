## Context

Submissões: `PK=FORM#<id>`, `SK=SUBMISSION#…`; respostas: `PK=SUBMISSION#<id>`. Ler N submissões = 1 + N queries. Os controllers calculam `limit` com `Math.min(Number(x) || DEFAULT, MAX)`.

## Goals / Non-Goals

**Goals:** leitura completa e limitada; entradas inválidas = 400.

**Non-Goals:** mudar o modelo de dados para evitar o N+1 (ex.: respostas embutidas na submissão) — é a correção definitiva, mas exige migração; avaliar depois com métricas. Export assíncrono para S3 também fica para depois.

## Decisions

- **Lotes de 25** em vez de `p-limit`: um `for` sobre fatias + `Promise.all` cobre o caso sem dependência.
- **Cursor validado por forma e escopo:** `{ PK, SK }` com `PK === FormSubmissionItem.getPK(formId)` e `SK.startsWith('SUBMISSION#')`. Evita leitura de outra partição via `ExclusiveStartKey`.
- **Um parser** `parsePagination(query, { default, max })` compartilhado pelos 3 controllers + tool MCP.

## Risks / Trade-offs

- [`queryAll` em contas grandes aumenta latência] → só nos `findBy*` que já precisavam de tudo; rotas paginadas continuam com `Limit`.
- [Export de 20 000 linhas ainda pode estourar 29 s] → lotes reduzem pressão; se medir timeout, reduzir `MAX_EXPORT_ROWS` ou partir para export assíncrono.
