## Context

O DI resolve classes uma vez por container e as reutiliza; qualquer estado de instância vira estado global entre requisições. `UnitOfWork` já limpa `transactItems`; `Saga` não. O User Pool usa e-mail como username e o trigger força confirmação + verificação.

## Goals / Non-Goals

**Goals:** um sign-up nunca afeta outro; só quem prova posse do e-mail tem conta; credenciais de conta removida param de funcionar.

**Non-Goals:** MFA; tela de gestão de grants OAuth (ver `fix-web-session-lifecycle`); papéis IAM por função (ver `harden-api-iam-and-bucket`).

## Decisions

- **Saga sem estado de instância.** `run(fn)` passa a dar a `fn` um `addCompensation` local: `saga.run(async (compensate) => { ...; compensate(() => ...) })`. Alternativa descartada: limpar o array no `finally` — continua quebrando com requisições concorrentes no mesmo container (Node atende uma por vez no Lambda, mas o padrão fica frágil e enganoso).
- **Unicidade por item de lock** `PK=ACCOUNT_EMAIL#<email>` com `ConditionExpression: attribute_not_exists(PK)` na `SignUpUnitOfWork`. GSI não garante unicidade. A compensação apaga Account, Profile e o lock.
- **Confirmação de e-mail via Cognito nativo** (`SignUp` sem auto-confirm → código; `ConfirmSignUp`; `ResendConfirmationCode`). O sign-up não devolve mais tokens: o web pede o código e então faz sign-in. Alternativa descartada: manter auto-verify e só remover `autoVerifyEmail` — deixaria e-mails não verificados confirmados e quebraria o "esqueci a senha".
- **Conta ativa:** checagem `accountRepository.findById` no `McpTokenAuthenticator` e no `apiKeyAuthorizer` (um GetItem por chamada; aceitável no volume atual).
- **403** para `NotAllowedError`: semântica correta; clientes que testam `!ok` não mudam.

## Risks / Trade-offs

- [Contas já criadas com e-mail de terceiros] → fora do alcance automático; o script de backfill lista duplicatas por caixa para revisão manual.
- [Usuário não confirma e tenta de novo] → `UsernameExistsException` no Cognito para usuário `UNCONFIRMED`: tratar reenviando o código em vez de erro.
- [Integradores que tratavam 405] → anotar no changelog do `openapi.yaml`.

## Migration Plan

1. Deploy API com o item de lock + backfill (`pnpm backfill:account-email`).
2. Deploy web com o passo de confirmação junto com a mudança do trigger.
Rollback: reverter trigger e web; os itens de lock são inofensivos.

## Open Questions

- O template do e-mail de código usa os `COGNITO_EMAILS_*` atuais ou um novo template react-email?
