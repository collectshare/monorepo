## 1. Env vars

- [x] 1.1 Add `VITE_WEB_APP_URL_DEV` and `VITE_WEB_APP_URL_PROD` to `apps/portal/.env-exemple`
- [x] 1.2 Set both vars in `apps/portal/.env` for local dev (point at the actual dev/prod app URLs)

## 2. Theme switcher

- [x] 2.1 Create `apps/portal/src/app/hooks/useTheme.ts`: reads `localStorage.theme`, falls back to `prefers-color-scheme`, exposes `{ theme, toggleTheme }`, and syncs the `dark` class on `document.documentElement`
- [x] 2.2 Create `apps/portal/src/views/layouts/PortalLayout/ThemeSwitcher.tsx` (icon button using `useTheme`, sun/moon icon from `lucide-react`)

## 3. Header / layout

- [x] 3.1 Create `apps/portal/src/views/layouts/PortalLayout/index.tsx`: renders a `<header>` (portal name/logo left, sign-in links + `ThemeSwitcher` right) and `<Outlet />` below it
- [x] 3.2 Build the two environment sign-in links in the header from `import.meta.env.VITE_WEB_APP_URL_DEV` / `VITE_WEB_APP_URL_PROD`, each `target="_blank" rel="noopener noreferrer"`, omitting a link when its env var is empty
- [x] 3.3 Wire `PortalLayout` into `apps/portal/src/app/router/index.tsx` as the wrapping route element for `/` and `/dataset/:formId`

## 4. Home page visual pass

- [x] 4.1 Adjust `apps/portal/src/views/pages/Home/index.tsx` heading/subheading and spacing to sit better under the new header, closer to the Kaggle reference layout (no changes to `useHomeController` or data fetching)

## 5. Verification

- [ ] 5.1 Run `pnpm --filter @monorepo/portal dev` (or the app's dev script) and manually verify: header renders on both routes, both sign-in links open the right URLs in a new tab, theme toggle switches and persists across reload, first load respects OS dark/light preference
- [ ] 5.2 Run `pnpm --filter @monorepo/portal lint` and `pnpm --filter @monorepo/portal typecheck`
