## Why

Várias escritas no DynamoDB perdem dados em silêncio: `FormRepository.update` faz `Put` do item inteiro e apaga incrementos concorrentes de `submissionCount`/`clickCount`/`downloadCount`; os incrementos sem condição criam itens `FORM#` fantasmas; o adapter de stream engole erros (loga `{}`) e avança o cursor, perdendo a indexação no Algolia; `BatchWrite` ignora `UnprocessedItems`; e `InsertQuestionsInFormUseCase` apaga as perguntas antigas antes de classificar e salvar as novas. Achados 1.2, 1.3, 1.4, 1.5(2,4,5), 2.5(4) e 4.2 do Relatório Backend.

## What Changes

- `DynamoDBDocumentClient` com `marshallOptions.removeUndefinedValues: true`.
- `FormRepository.update` com `UpdateCommand` só dos campos editáveis + `attribute_exists(PK)`; incrementos com `attribute_exists(PK)` (falha condicional = form apagado, ignorada e logada).
- `submissionCount` passa a ser incrementado **dentro da transação da submissão** (`SubmitFormUnitOfWork`); o consumer `onFormSubmitted` é removido. Idempotente por construção.
- `lambdaDynamoAdapter`: processa registros em ordem, para no primeiro erro e devolve `batchItemFailures` a partir dele (`functionResponseType: ReportBatchItemFailures`); log com `message` e `stack`.
- `QuestionRepository.saveMany`/`deleteMany`: retry de `UnprocessedItems` com backoff.
- `InsertQuestionsInFormUseCase`: classificar primeiro, depois salvar as novas, e só então apagar as removidas.
- `insertQuestionsInFormSchema`: rejeitar `id` vazio e ids repetidos; exigir `options` não vazias para MULTIPLE_CHOICE/CHECKBOX/DROPDOWN.
- Limpeza: remover `CreateFormUnitOfWork` (morto); `IFormSubmission.submittedAt: string`.

## Capabilities

### New Capabilities
- `data-integrity`: garantias de escrita do repositório (sem lost update, sem perda de evento, sem perda de perguntas).

### Modified Capabilities
<!-- nenhuma -->

## Impact

- `apps/api`: `infra/clients/dynamoClient.ts`, `FormRepository`, `SubmitFormUnitOfWork`, `OnFormSubmittedUseCase` + função `onFormSubmitted` (removidos), `lambdaDynamoAdapter`, `sls/functions/form.yml`, `QuestionRepository`, `InsertQuestionsInFormUseCase`, `insertQuestionsInFormSchema`, `CreateFormUnitOfWork`.
- `packages/shared/types/IFormSubmission.ts`.
- Coordena com `harden-form-submission` (limite de 98 respostas por causa do item extra na transação).
