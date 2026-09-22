## Context

`apps/portal` (`src/App.tsx` → `Router` → `Home` / `Dataset`) has no shared layout today — each page renders its own `max-w-* mx-auto` container directly under `BrowserRouter`/`QueryClientProvider`. There's no header, no navigation chrome, and no theme handling anywhere in the app. `packages/ui/src/styles.css` already ships a complete `.dark` token override (used nowhere yet in either `apps/web` or `apps/portal`), so dark mode is a matter of toggling a class, not defining new tokens.

The portal is deployed as two independent static sites (`portal-dev.collectshare.com.br`, `portal.collectshare.com.br`, per `infra/portal-spa/main.tf`), each built from the same source with different `VITE_*` env vars (see `apps/portal/.env-exemple`, mirroring `apps/web`'s `VITE_API_URL` pattern). The authenticated web app is deployed the same way but its dev/prod URLs aren't yet captured as portal env vars.

## Goals / Non-Goals

**Goals:**
- Give the portal a persistent header/nav shared by all pages, visually closer to the Kaggle reference (product identity left, utility actions right).
- Let a visitor jump to CollectShare login in either environment (dev or prod) regardless of which portal deployment they're on.
- Add a working light/dark theme switcher using the tokens `packages/ui` already defines.

**Non-Goals:**
- Redesigning `Home`/`Dataset` page content or search UX beyond minor spacing/heading tweaks.
- Building a shared `ThemeProvider` in `packages/ui` for `apps/web` to consume — this change scopes the switcher to `apps/portal` only. Sharing it later is a natural follow-up, not required here.
- Any backend/API change — this is portal-frontend only.

## Decisions

- **New `PortalLayout` component, not per-page headers.** Add `apps/portal/src/views/layouts/PortalLayout/index.tsx` rendering a `<Header>` plus `<Outlet />`, and wrap it around the route tree in `app/router/index.tsx`. Alternative considered: duplicate a header in `Home` and `Dataset` — rejected, violates the "add to shared layout" pattern already used for `@monorepo/ui` and would drift as pages are added.
- **Env-var-driven sign-in links, not environment auto-detection.** Two static links ("Entrar (Dev)" / "Entrar (Prod)") read from `VITE_WEB_APP_URL_DEV` and `VITE_WEB_APP_URL_PROD`, both always rendered, each `target="_blank" rel="noopener noreferrer"`. Alternative considered: detect current portal host and only show the matching env's login — rejected because the proposal explicitly asks for both links "respectively dev and prod" and a visitor on the dev portal may still want to log into prod (or vice versa) to check data.
- **Theme switcher toggles a `dark` class on `<html>`, backed by `localStorage`.** A small `useTheme` hook (`apps/portal/src/app/hooks/useTheme.ts`) reads `localStorage.theme`, falls back to `window.matchMedia('(prefers-color-scheme: dark)')`, and toggles `document.documentElement.classList`. This matches how the `.dark` class selector in `packages/ui/src/styles.css` is already written (class-based, not `data-theme` or media-query-only). Alternative considered: OS-only theme (no manual switch) — rejected, proposal explicitly asks for a switcher.
- **Keep the hook local to `apps/portal` for now**, not in `@monorepo/ui`. `apps/web` doesn't have a theme switcher yet and retrofitting it is out of scope; duplicating ~20 lines later is cheaper than designing a shared API prematurely for a single consumer.
- **`Home` visual tweaks stay inline style/className edits**, not a rewrite — the controller (`useHomeController`) and data flow are untouched.

## Risks / Trade-offs

- [Hardcoded dev/prod URLs if env vars are unset] → Both links read from required `VITE_WEB_APP_URL_DEV`/`VITE_WEB_APP_URL_PROD`; document them in `.env-exemple` and fall back to hiding a link (not rendering a broken `href`) if a var is empty.
- [Theme flicker on load (FOUC) before the `useTheme` hook runs] → Acceptable for this change since the portal is a simple SPA with no SSR; a follow-up could add an inline `<script>` in `index.html` if flicker proves noticeable.
- [Divergence between `apps/portal`'s ad-hoc theme hook and any future `apps/web` theme switcher] → Accepted for now (see Decisions); flagged as a natural follow-up if `apps/web` adds theming.

## Open Questions

- Exact prod/dev URLs for the authenticated web app aren't in this repo's Terraform yet (only portal's are). Implementation should read them purely from env vars and not guess/hardcode a domain.
