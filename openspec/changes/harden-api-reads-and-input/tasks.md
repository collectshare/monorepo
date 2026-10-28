## 1. Leitura completa

- [ ] 1.1 Helper `queryAll(command)` seguindo `LastEvaluatedKey`
- [ ] 1.2 Aplicar nos `findBy*` de Question, Answer, Form (por conta) e ApiKey (por conta)

## 2. Concorrência

- [ ] 2.1 Helper `mapInBatches(items, 25, fn)`
- [ ] 2.2 Usar nas queries de submissões/export/dataset e na assinatura de URLs S3

## 3. Paginação

- [ ] 3.1 `parsePagination` com validação de `limit` e `cursor` (escopo do form); `decodeCursor` sem throw cru
- [ ] 3.2 Usar nos controllers paginados e no `GetFormSubmissionsTool` (repassar `limit`, `total` via `submissionCount` do form)
- [ ] 3.3 `timeout: 29` em `getPortalDatasetData`/`getOwnSubmissionData` (`external.yml`)

## 4. Verificação

- [ ] 4.1 Testes de `parsePagination` e `queryAll`
- [ ] 4.2 `pnpm --filter @monorepo/api typecheck && pnpm --filter @monorepo/api test`
- [ ] 4.3 Dev: `cursor=abc`, `limit=-5`, dataset grande no portal, `verify:mcp-server`
