## 1. Saga e compensação

- [ ] 1.1 `Saga.run(fn)` com compensações locais à execução; atualizar todos os usos (`grep -rn "saga\." apps/api/src`)
- [ ] 1.2 Compensação do sign-up apaga Account, Profile e lock no DynamoDB além do usuário Cognito
- [ ] 1.3 Teste: duas execuções seguidas, a segunda falha, a primeira não é compensada

## 2. Unicidade de e-mail

- [ ] 2.1 Normalizar e-mail no sign-up, sign-in, forgot-password e `findByEmail`
- [ ] 2.2 Item `ACCOUNT_EMAIL#` com `attribute_not_exists` na `SignUpUnitOfWork`; `TransactionCanceled` → `EmailAlreadyInUse`
- [ ] 2.3 Script `backfill:account-email` (cria locks, lista duplicatas por caixa)

## 3. Confirmação de e-mail

- [ ] 3.1 `preSignUpTrigger` sem auto-confirm/auto-verify
- [ ] 3.2 `AuthGateway.confirmSignUp` / `resendConfirmationCode`; controllers + funções em `auth.yml`
- [ ] 3.3 `SignUpUseCase` não devolve tokens; usuário `UNCONFIRMED` existente → reenviar código
- [ ] 3.4 Web: passo "digite o código" no SignUp, depois sign-in automático com a senha em memória (nunca em storage)

## 4. Schemas de senha

- [ ] 4.1 `passwordSchema`: sem `trim`, símbolo `/[^A-Za-z0-9]/`
- [ ] 4.2 `signInSchema`: `z.string().min(1)`

## 5. Credenciais

- [ ] 5.1 `McpTokenAuthenticator` e `apiKeyAuthorizer`: negar se a conta não existe
- [ ] 5.2 `OAuthClientService`: revalidar redirect URIs do `client_id`
- [ ] 5.3 `NotAllowedError` → 403; atualizar testes, `openapi.yaml`, `API_DOCS.md`

## 6. Verificação

- [ ] 6.1 `pnpm --filter @monorepo/api typecheck && pnpm --filter @monorepo/api test`
- [ ] 6.2 Dev: cadastro com confirmação, e-mail com caixa diferente, `verify:mcp-oauth` e `verify:mcp-server`
