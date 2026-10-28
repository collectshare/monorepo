## Why

No `apps/web` a sessão de um usuário vaza para o próximo na mesma aba: `signout()` remove `['users','me']`, mas a query é `['accounts','me']` com `staleTime: Infinity`, e nenhum outro cache privado é limpo. O access token expira e o app só falha (não há interceptor de 401 nem uso do `REFRESH_TOKEN`, embora `POST /auth/refresh-token` exista). A senha do cadastro fica em texto puro no `sessionStorage`. Achados 2.1, 2.2, 2.3, 2.10 (auth), 3.1 e 3.3 do Relatório Frontend.

## What Changes

- `signout()` chama `queryClient.clear()`.
- Interceptor de resposta no `httpClient`: em 401, uma única chamada a `/auth/refresh-token` (compartilhada entre requisições simultâneas) e repetição da original; se o refresh falhar, `signout()`.
- `useEffect` do `AuthContext` depende de `data` (Sentry/Clarity identificam o usuário).
- SignUp: rascunho em `sessionStorage` sem `password`/`confirmPassword`.
- SignIn/SignUp mostram erro genérico para status não tratados (409, 400, 5xx).
- ForgotPassword/NewPassword navegam para `/sign-in` (hoje `/login`, 404); `NewPassword` usa `location.state?.email` e redireciona em `useEffect`/`<Navigate>`, não no render.
- OAuth consent: mostra o e-mail da conta logada com "Trocar de conta"; o link "Cadastre-se" preserva `returnTo`; o texto "pode revogar a qualquer momento" sai até existir tela de revogação; `redirectTo` só é seguido se for `http:`/`https:`.

## Capabilities

### New Capabilities
- `web-session`: ciclo de vida da sessão no `apps/web` (login, renovação, logout) e o consentimento OAuth.

### Modified Capabilities
<!-- nenhuma -->

## Impact

- `apps/web`: `AuthContext.tsx`, `services/httpClient.ts`, `authService` (refresh), `SignUp/useSignUpController.ts`, `SignIn/useSignInController.ts`, `SignIn/index.tsx`, `ForgotPassword/*`, `NewPassword/*`, `OAuthAuthorize/*`.
- Depende do contrato atual de `POST /auth/refresh-token`. Se `harden-signup-and-auth` entrar antes, o passo de confirmação do SignUp reaproveita estas correções de erro.
- Nenhuma dependência nova.
