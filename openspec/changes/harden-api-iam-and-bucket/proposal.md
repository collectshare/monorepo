## Why

Todas as Lambdas, inclusive as rotas públicas sem autenticação, compartilham uma role com `DeleteItem`/`BatchWriteItem`, `cognito-idp:AdminDeleteUser` e `s3:PutObject`, e recebem `MASTER_SECRET`, `EXPORT_SECRET`, `ALGOLIA_ADMIN_API_KEY` e `COGNITO_CLIENT_SECRET` no ambiente. Uma falha numa rota pública tem o raio de explosão da conta inteira. O bucket principal não declara bloqueio de acesso público nem criptografia. Achado 1.7 do Relatório Backend.

## What Changes

- `MainBucket`: `PublicAccessBlockConfiguration` (tudo `true`) e `BucketEncryption` SSE-S3 explícitos.
- Roles por grupo de funções (não por função): `public-read` (portal/GET de form: só leitura na tabela + Algolia search), `public-write` (submissão: `PutItem`/`TransactWrite` + `s3:PutObject` no prefixo `forms/*`), `authenticated` (rotas Cognito, `/v1`, `/mcp`) e `triggers` (streams/Cognito). Feito com `role:` por função apontando para roles declaradas em `sls/resources/` (sem plugin novo; hoje `provider.iam.role` aponta para `sls/config/role.yml`).
- Segredos só nas funções que os usam (`environment` por função em vez de global para `MASTER_SECRET`, `EXPORT_SECRET`, `ALGOLIA_ADMIN_API_KEY`, `COGNITO_CLIENT_SECRET`).

## Capabilities

### New Capabilities
- `api-infra-security`: permissões mínimas por grupo de função e configuração segura do bucket.

### Modified Capabilities
<!-- nenhuma -->

## Impact

- `apps/api/sls/config/role.yml`, `sls/config/env.yml`, `sls/resources/MainBucket.yml`, `sls/functions/*.yml`, `serverless.yml`.
- Risco de `AccessDenied` em produção se um grupo ficar sem permissão: exige rodar `verify:mcp-oauth`, `verify:mcp-server` e um passeio manual completo em dev.
