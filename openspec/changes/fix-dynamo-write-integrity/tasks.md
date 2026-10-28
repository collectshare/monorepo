## 1. Cliente e mappers

- [ ] 1.1 `dynamoClient`: `removeUndefinedValues: true`
- [ ] 1.2 Teste de mapper: `FormItem.fromEntity` sem opcionais grava sem erro (mock do client)

## 2. FormRepository e contador

- [ ] 2.1 `update` com `UpdateCommand` (título, descrição, `descriptionAlign`, tags, `onePage`, `updatedAt`) + `attribute_exists(PK)`
- [ ] 2.2 Incrementos com `attribute_exists(PK)`; `ConditionalCheckFailed` logado e ignorado
- [ ] 2.3 `SubmitFormUnitOfWork`: `Update ADD submissionCount :1` na transação
- [ ] 2.4 Remover `OnFormSubmittedUseCase`, handler e função `onFormSubmitted`
- [ ] 2.5 Script one-off `recount:submissions`

## 3. Streams

- [ ] 3.1 `lambdaDynamoAdapter` sequencial, `batchItemFailures` a partir do primeiro erro, log com `message`/`stack`
- [ ] 3.2 `functionResponseType: ReportBatchItemFailures` no `onFormChanged`
- [ ] 3.3 Teste do adapter: segundo registro falha → falhas = [2º, 3º]

## 4. Perguntas

- [ ] 4.1 `saveMany`/`deleteMany`: retry de `UnprocessedItems`
- [ ] 4.2 `InsertQuestionsInFormUseCase`: classificar → salvar → apagar ausentes
- [ ] 4.3 `insertQuestionsInFormSchema`: `id` `min(1)`, ids únicos (`superRefine`), `options` obrigatório nos tipos de escolha

## 5. Limpeza

- [ ] 5.1 Remover `CreateFormUnitOfWork`
- [ ] 5.2 `IFormSubmission`: `submittedAt: string`; ajustar web/portal
- [ ] 5.3 Comentário em `ApiKeyItem` explicando por que `expiresAt` é ISO (fora do TTL)

## 6. Verificação

- [ ] 6.1 `pnpm --filter @monorepo/api typecheck && pnpm --filter @monorepo/api test`; `pnpm build`
- [ ] 6.2 Dev: deploy, `recount:submissions`, editar form com submissões chegando, conferir Algolia após editar
