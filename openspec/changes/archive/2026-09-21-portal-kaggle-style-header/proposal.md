## Why

`apps/portal` currently ships with no persistent header/navigation — `Home` and `Dataset` are standalone pages with no shared chrome. This makes the portal feel like a bare demo instead of a public data catalog, and gives visitors no way to get from the portal into the authenticated `apps/web` product to sign in. The reference (Kaggle's Datasets page) shows the pattern we want: a slim top bar with the product identity, a search-adjacent layout, and utility links (sign in, theme) always visible. We also want a way for visitors to jump straight into the CollectShare app to log in — and since dev and prod are separate deployments/domains, both destinations should be reachable from the bar rather than only whichever environment the portal happens to be running in.

## What Changes

- Add a persistent portal header (top bar) rendered above `Home` and `Dataset`, styled closer to the Kaggle reference: product name/logo on the left, utility actions on the right.
- Add two "Sign In" links in the header pointing at the CollectShare app login for each environment ("Dev" and "Prod"), each opening in a new tab. Destination URLs are read from `VITE_WEB_APP_URL_DEV` / `VITE_WEB_APP_URL_PROD` env vars (mirroring the existing `VITE_API_URL` convention).
- Add a light/dark theme switcher in the header, toggling the `.dark` class already defined in `packages/ui`'s `styles.css` design tokens. Selection persists per-browser via `localStorage` and respects `prefers-color-scheme` on first load.
- Apply minor visual adjustments to `Home` to align more closely with the Kaggle reference (heading/subheading treatment above the search bar, spacing), without changing its data-fetching behavior.

## Capabilities

### New Capabilities
- `portal-header`: persistent portal navigation bar with environment sign-in links and a theme switcher, shared across all portal pages.

### Modified Capabilities
(none — no existing specs are being changed)

## Impact

- `apps/portal/src/views/layouts/` (new): `PortalLayout`/`Header` component wrapping the router outlet.
- `apps/portal/src/app/router/index.tsx`: wrap routes with the new layout.
- `apps/portal/src/views/pages/Home/index.tsx`: minor layout/style tweaks only.
- `apps/portal/.env-exemple`, `apps/portal/.env`: add `VITE_WEB_APP_URL_DEV` / `VITE_WEB_APP_URL_PROD`.
- `packages/ui` styles/theme tokens are reused as-is (`.dark` class already defined); no changes expected there beyond possibly exporting a small theme-toggle hook if it makes sense to share with `apps/web` later (out of scope for this change).
- No API or backend changes.
