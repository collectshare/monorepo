## Why

Os componentes compartilhados têm defeitos que aparecem em todas as telas: modais e sheets não fecham com Esc nem clique fora (e o X está comentado); `Button` com `disabled={false}` ignora `isLoading` e com `asChild` + `isLoading` quebra o `Slot`; `RichText plain` ignora quebras simples; o `RichTextEditor` não acompanha `value` externo; e há `<button><a>` e campos sem rótulo acessível. Achados 1.2, 1.3, 4.1, 4.3, 4.4, 4.5 (PasswordInput, Link em Button) e 4.6 (ErrorBoundary/Suspense do web, tema) do Relatório Frontend.

## What Changes

- `ModalContext`/`SheetContext`: `onOpenChange={(open) => !open && close()}`; `Dialog` volta a ter o botão fechar com `aria-label`.
- `Button`: `disabled={isLoading || props.disabled}` depois do spread; com `asChild`, o loader não é injetado (só `aria-busy`/`disabled`).
- `RichText plain` com `remarkBreaks` e `urlTransform={safeUrl}`.
- `RichTextEditor`: `useEffect` que aplica `value` externo quando difere do markdown atual do editor (sem mexer no cursor durante a digitação).
- `DataTable`: não trocar o componente do corpo durante resize (memo sempre); paginação com `disabled` em primeira/última e `aria-label` nos 4 botões; filtro global controlado.
- `PasswordInput`: botão depois do input, `aria-label` "Mostrar/Ocultar senha", `pr-10`. `SignUp`/`ForgotPasswordConfirm`: `<Button asChild><Link/></Button>`.
- `apps/web/App.tsx`: providers e ErrorBoundary lazy dentro de `<Suspense>`. `ThemeContext.toggleTheme` com `system` alterna a partir do tema efetivo.

## Capabilities

### New Capabilities
- `ui-kit`: comportamento e acessibilidade dos componentes compartilhados (`@monorepo/ui` e `apps/web/components/ui`).

### Modified Capabilities
<!-- form-description-rich-text pertence à change aberta add-form-description-rich-text; o ajuste do plain entra aqui como ADDED em ui-kit para não reabrir aquela spec -->

## Impact

- `packages/ui`: `Button.tsx`, `RichText.tsx`, `DataTable/*`.
- `apps/web`: `ModalContext.tsx`, `SheetContext.tsx`, `components/ui/Dialog.tsx`, `PasswordInput.tsx`, `RichTextEditor/index.tsx`, `SignUp/index.tsx`, `ForgotPasswordConfirm/index.tsx`, `App.tsx`, `ThemeContext.tsx`.
- Fora: unificar tema web × portal e os dois `FormField` (sem bug concreto que justifique agora).
