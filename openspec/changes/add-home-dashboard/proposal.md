## Why

The Home page (`/`) currently renders only a static welcome message. Every actionable piece of information — how many forms exist, which ones are new, which ones are getting traction, how to start a new one — lives one extra click away on "Meus formulários". The landing screen a user sees right after login should answer "what's going on with my forms?" and offer the single most common action (create a form) without navigation.

## What Changes

- Replace the static Home welcome message with a dashboard assembled from data the API already returns via `GET /forms` (`Form.createdAt`, `submissionCount`, `clickCount`, `downloadCount`, `isPublished`) — no new backend endpoint required.
- Add a large, primary "Novo formulário" call-to-action at the top of the dashboard that navigates to `/forms/builder`.
- Add summary stat tiles: total de formulários, total de respostas recebidas, formulários publicados vs. em rascunho.
- Add a "Criados recentemente" list showing the last N forms by `createdAt`, each linking to its results dashboard (`/forms/dashboard/:formId`).
- Add a "Mais respondidos" ranking (top N by `submissionCount`) and a "Mais acessados no portal" ranking (top N by `clickCount`), presented as separate lists since one measures response volume and the other measures public dataset views — a form can rank high on one and zero on the other.
- Add an empty-state variant for brand-new accounts (zero forms) that emphasizes the create-form CTA and briefly explains what a form is for, instead of showing empty stat tiles/lists.
- Add a "Sem respostas ainda" callout surfacing published forms with `submissionCount === 0`, nudging the user to share the link — a distinct, non-obvious opportunity beyond what was asked for explicitly.
- Link each dashboard entry through to the existing per-form results page or the "Meus formulários" table rather than duplicating table functionality on Home.

## Capabilities

### New Capabilities
- `home-dashboard`: The authenticated Home page (`/`) summarizing the account's forms — creation shortcut, aggregate stats, recent forms, most-responded/most-accessed rankings, and a no-response nudge — sourced entirely from existing form data.

### Modified Capabilities
- (none — `GET /forms` and the `Form` entity already expose every field this dashboard needs; no existing spec behavior changes)

## Impact

- **Affected code**: `apps/web/src/views/pages/Home` (rewritten), likely a new `useHomeController` hook and small presentational subcomponents (stat tiles, recent list, ranking list, empty state), reusing `formsService.list()` from `apps/web/src/app/services/formsService`.
- **Not affected**: `apps/api` (no new endpoints, no schema changes), `packages/shared` (no entity changes), `apps/portal` (unrelated, public app).
- **Dependencies**: `@monorepo/ui` components (`Card`, `Button`, `Badge`, etc.) for visual consistency with `MyForms`/`FormDashboard`.
