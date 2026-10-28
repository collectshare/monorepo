## Why

As leituras de submissões não aguentam crescimento: os `findBy*` fazem um único `Query` e truncam em 1 MB sem avisar; cada submissão dispara um `Query` de respostas em paralelo sem limite (até 20 000 no export, 1 000 em `/v1` com timeout padrão de 6 s); o tool MCP `get_form_submissions` carrega tudo e corta em memória; e um `cursor` malformado ou `limit=-5` vira 500 em vez de 400. Achados 1.6 e 3.1 do Relatório Backend.

## What Changes

- Helper `queryAll` que segue `LastEvaluatedKey`, usado em todos os `findBy*` que devem trazer tudo (`QuestionRepository.findByFormId`, `AnswerRepository.findBySubmissionId`, `FormRepository.findByAccountId`, `ApiKeyRepository.findByAccountId`).
- Busca das respostas com concorrência limitada (lotes de 25) em `GetFormSubmissionsQuery`, `ExportPublishedFormDataQuery`, `GetPublishedFormDataQuery` e na assinatura de URLs S3.
- `timeout: 29` nas funções `/v1` de leitura de dados (`external.yml`), como `getFormSubmissions`.
- `GetFormSubmissionsTool` repassa `limit` ao controller (paginação no banco, não em memória).
- Parser único de paginação: `limit` inteiro 1..MAX, `cursor` base64 de JSON com exatamente `PK`/`SK` do form pedido; qualquer outra coisa → 400 `VALIDATION`.

## Capabilities

### New Capabilities
- `paginated-reads`: contrato de `limit`/`cursor` e completude das leituras.

### Modified Capabilities
<!-- api-openapi-docs: o openapi.yaml já documenta minimum: 1 / integer; só passa a ser verdade -->

## Impact

- `apps/api`: repositórios DynamoDB, `FormSubmissionRepository` (`decodeCursor`), queries citadas, `GetFormSubmissionsTool`, controllers paginados (`GetPublishedFormDataController`, `ExternalGetPublishedFormDataController`, `ExternalGetOwnFormDataController`), `sls/functions/external.yml`.
- Sem dependência nova (o limitador de concorrência é um loop de lotes de poucas linhas).
