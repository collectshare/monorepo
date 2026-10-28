## 1. Sessão

- [ ] 1.1 `AuthContext.signout`: `queryClient.clear()`; `useEffect` com `data` nas dependências
- [ ] 1.2 `authService.refreshToken` + interceptor de 401 com promessa compartilhada e `_retry`; callback `setOnSessionExpired` registrado pelo provider
- [ ] 1.3 Conferir que `signin` grava os dois tokens e o interceptor atualiza ambos após refresh

## 2. Telas de auth

- [ ] 2.1 SignUp: excluir `password`/`confirmPassword` do rascunho no `sessionStorage`
- [ ] 2.2 SignIn/SignUp: toast genérico no `else` dos status tratados; 409 com mensagem própria
- [ ] 2.3 ForgotPassword/NewPassword: `/sign-in`; `location.state?.email`; redirecionamento fora do render

## 3. OAuth consent

- [ ] 3.1 Mostrar e-mail logado + "Trocar de conta" (signout preservando `returnTo`)
- [ ] 3.2 Link "Cadastre-se" do SignIn propaga `?returnTo` sanitizado; SignUp redireciona para ele ao final
- [ ] 3.3 Remover a frase de revogação; checar protocolo antes de `window.location.assign`

## 4. Verificação

- [ ] 4.1 `pnpm --filter @monorepo/web typecheck && pnpm --filter @monorepo/web lint`
- [ ] 4.2 Manual: logout/login com outra conta na mesma aba; token expirado (apagar/forjar no localStorage); fluxo MCP com conta nova
