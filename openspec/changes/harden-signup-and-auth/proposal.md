## Why

O `Saga` é um singleton `@Injectable()` cujo array `compensations` nunca é limpo: num container Lambda aquecido, qualquer falha de sign-up (até `EmailAlreadyInUse`) executa as compensações acumuladas e **apaga do Cognito usuários que já tinham se cadastrado**. Além disso o `preSignUpTrigger` confirma e verifica qualquer e-mail sem prova de posse, a unicidade de e-mail não é atômica nem case-insensitive, e o `passwordSchema` faz `trim()` e rejeita símbolos válidos (o login devolve 400 em vez de 401). Achados 1.1, 2.4, 2.5(6), 3.3 (senha) e 3.4 (`NotAllowedError` 405) do Relatório Backend.

## What Changes

- `Saga` deixa de guardar estado entre requisições (compensações por execução de `run`).
- Falha após gravar `Account`/`Profile` (ex.: `signIn`) também desfaz os itens no DynamoDB.
- E-mail normalizado (`trim().toLowerCase()`) no sign-up, sign-in e `findByEmail`; unicidade garantida por item `ACCOUNT_EMAIL#<email>` com `attribute_not_exists` na mesma transação.
- **Verificação de e-mail:** `preSignUpTrigger` para de marcar `autoVerifyEmail`/`autoConfirmUser`; o cadastro passa a exigir o código enviado por e-mail (`POST /auth/confirm-sign-up`, `POST /auth/resend-code`) e o web ganha o passo de confirmação.
- `passwordSchema`: sem `trim`, símbolo = qualquer caractere não alfanumérico (igual à política do Cognito). `signInSchema` só exige string não vazia.
- `McpTokenAuthenticator` e `apiKeyAuthorizer` recusam tokens/chaves de conta inexistente; `OAuthClientService` revalida as `redirect_uris` do `client_id` contra a allowlist atual.
- **BREAKING:** `NotAllowedError` passa de 405 para 403 (Cognito, `/v1`, `/mcp` via `toErrorPayload`).

## Capabilities

### New Capabilities
- `account-signup`: cadastro, confirmação de e-mail e unicidade de conta.
- `api-authorization`: o que torna uma credencial (MCP token, API key, client OAuth) válida e qual status uma negação devolve.

### Modified Capabilities
<!-- nenhuma -->

## Impact

- `apps/api`: `shared/saga/Saga.ts`, `SignUpUseCase`, `SignUpUnitOfWork`, `AccountRepository`, `preSignUpTrigger`, `AuthGateway` (confirm/resend), novos controllers + `sls/functions/auth.yml`, schemas de auth, `McpTokenAuthenticator`, `apiKeyAuthorizer`, `OAuthClientService`, `NotAllowedError`.
- `apps/web`: passo "confirme seu e-mail" no SignUp.
- `openapi.yaml` (403), `API_DOCS.md`, `CLAUDE.md`.
- Dados: script one-off para criar `ACCOUNT_EMAIL#` das contas existentes e reportar e-mails duplicados por caixa.
