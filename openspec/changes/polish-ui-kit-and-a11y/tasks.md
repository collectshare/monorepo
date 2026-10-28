## 1. packages/ui

- [ ] 1.1 `Button`: ordem do `disabled`, `asChild` sem spinner, `aria-busy`
- [ ] 1.2 `RichText plain`: `remarkBreaks` + `urlTransform`; teste em `RichTextEditor.test.tsx`
- [ ] 1.3 `DataTable`: corpo memo sempre; paginação com `disabled`/`aria-label`; filtro global controlado

## 2. apps/web

- [ ] 2.1 `ModalContext`/`SheetContext` com `onOpenChange`; `Dialog` com botão fechar
- [ ] 2.2 `RichTextEditor`: sync de `value` externo
- [ ] 2.3 `PasswordInput`: ordem no DOM, `aria-label`, `pr-10`
- [ ] 2.4 `SignUp`/`ForgotPasswordConfirm`: `Button asChild`
- [ ] 2.5 `App.tsx`: lazy dentro de `Suspense`; `ThemeContext.toggleTheme` com `system`

## 3. Verificação

- [ ] 3.1 `pnpm lint && pnpm --filter @monorepo/web test && pnpm build`
- [ ] 3.2 Manual: Esc/overlay em modal e sheet, teclado na paginação, tema system → toggle
