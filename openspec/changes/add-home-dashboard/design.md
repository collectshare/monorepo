## Context

`apps/web`'s Home page (`/`, `apps/web/src/views/pages/Home/index.tsx`) is a static welcome message. `GET /forms` (`ListFormsUseCase` → `FormRepository.findByAccountId`) already returns every `Form` for the authenticated account, including `createdAt`, `submissionCount`, `clickCount`, `downloadCount`, and `isPublished`. `apps/web/src/views/pages/MyForms` already fetches this same list via `formsService.list()` under the TanStack Query key `['my-forms']` and renders it in a `DataTable`. The new Home dashboard is a second view over the same data, not a new data source.

`clickCount`/`downloadCount` are only incremented by the public portal controllers (`GetPublishedFormController`, `ExportPublishedFormDataController`) when a form is published and viewed/exported through `apps/portal`. They stay `0` for unpublished forms and are unrelated to who submitted a response.

## Goals / Non-Goals

**Goals:**
- Turn `/` into an at-a-glance summary of the account's forms plus a fast path to create a new one.
- Reuse existing data (`GET /forms`) and existing UI primitives (`@monorepo/ui`) — no new backend surface.
- Handle the zero-forms state explicitly so a brand-new account isn't shown empty tiles/lists.

**Non-Goals:**
- No new API endpoint, pagination, or server-side aggregation for this iteration.
- No time-series/trend charts (e.g., submissions-per-day sparklines) — would need submission-level date bucketing not currently exposed by any endpoint; left as a future iteration.
- No changes to `MyForms`, `FormDashboard`, or any API/DB schema.

## Decisions

- **Client-side aggregation over `GET /forms`, no new endpoint.** Account form counts at this stage are small; computing counts, recency sort, and top-N rankings with array operations in a `useHomeController` hook is cheap and keeps the change frontend-only. Alternative considered: a dedicated `/forms/summary` endpoint — rejected for now as premature; revisit if account sizes grow large enough that shipping the full form list to render a summary becomes wasteful.
- **Share the `['my-forms']` query cache key.** `useHomeController` calls `formsService.list()` under the same TanStack Query key `MyForms` already uses, so navigating Home → Meus formulários (or back) reuses the cached response instead of double-fetching.
- **Two separate ranking lists, not one blended "most accessed".** `submissionCount` (responses) and `clickCount` (public portal views) measure different things, and `clickCount` is structurally `0` for any unpublished form. Presenting "Mais respondidos" (by `submissionCount`) and "Mais acessados no portal" (by `clickCount`) separately avoids implying a form got zero attention when it simply isn't published. The portal-views list is omitted entirely when no form has `clickCount > 0`, rather than rendering an empty/misleading section.
- **Component split mirrors `MyForms`.** `Home/index.tsx` + `useHomeController.ts` (data/derivations) orchestrate presentational subcomponents in `Home/components/`: `HomeStats` (tiles), `RecentFormsList`, `TopFormsList` (reused for both rankings via a `metric` prop), `NoResponsesCallout`, `HomeEmptyState`. This keeps parity with the existing `MyForms`/`FormsTable` pattern in the codebase.
- **"Sem respostas ainda" callout scope.** Filters `isPublished && submissionCount === 0`, sorted by `createdAt` desc, capped at N (5) — surfaces the most recent stale forms rather than every one, so the callout stays a nudge rather than another full list.
- **All derived lists cap at 5 items**, linking out to `/my-forms` ("ver todos") and to `/forms/dashboard/:formId` per item, so Home stays a summary and `MyForms` remains the canonical full list/table.

## Risks / Trade-offs

- **[Risk] Client-side aggregation won't scale if an account accumulates thousands of forms** (full list shipped over the wire just to show 5 items) → **Mitigation**: acceptable for current scale; revisit with a `/forms/summary` endpoint if/when this becomes measurable.
- **[Risk] "Mais acessados no portal" can look empty/confusing for accounts that don't publish forms to the portal** → **Mitigation**: section is hidden entirely (not shown empty) when no form has `clickCount > 0`.
- **[Risk] Duplicating list-derivation logic between `Home` and `MyForms`** (e.g., date formatting, navigation targets) → **Mitigation**: reuse existing `formatDate` util and the same route targets (`/forms/dashboard/:formId`, `/forms/builder/:id`) already used in `FormsTable`'s column actions instead of re-deriving them.

## Migration Plan

Pure frontend change, no data migration. Ships as a normal `apps/web` deploy; no feature flag needed since the prior Home content was inert (a static message with no user-facing behavior to preserve). Rollback is a plain revert of the `apps/web` deploy.

## Open Questions

- Exact N for "recent" and "top" list lengths — defaulted to 5 in this design; adjust during implementation if it reads too sparse/dense in the actual layout.
