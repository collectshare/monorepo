## 1. Data & Controller

- [x] 1.1 Create `apps/web/src/views/pages/Home/useHomeController.ts` that fetches `formsService.list()` under the shared `['my-forms']` TanStack Query key
- [x] 1.2 Derive in the controller: total forms, total responses (sum `submissionCount`), published/draft counts, recent forms (top 5 by `createdAt` desc), top-responded forms (top 5 by `submissionCount` desc, only when max > 0), top-accessed forms (top 5 by `clickCount` desc, only when max > 0), no-response published forms (top 5 by `createdAt` desc where `isPublished && submissionCount === 0`)
- [x] 1.3 Expose an `isEmpty` flag (`forms.length === 0`) and `isLoadingForms` from the controller

## 2. Presentational Components

- [x] 2.1 Create `Home/components/HomeEmptyState` — zero-forms explanation + CTA
- [x] 2.2 Create `Home/components/HomeStats` — stat tiles (total forms, total responses, published/draft) using `@monorepo/ui` `Card`
- [x] 2.3 Create `Home/components/RecentFormsList` — last 5 forms by `createdAt`, each linking to `/forms/dashboard/:formId`, with a "ver todos" link to `/my-forms`
- [x] 2.4 Create `Home/components/TopFormsList` — reusable ranking list taking a `metric` ('submissionCount' | 'clickCount'), label, and items, linking each entry to `/forms/dashboard/:formId`
- [x] 2.5 Create `Home/components/NoResponsesCallout` — nudge listing published forms with zero responses, with a "copiar link" action reusing the share-link pattern from `FormsTable`'s row actions

## 3. Home Page Assembly

- [x] 3.1 Rewrite `Home/index.tsx` to use `useHomeController`, rendering `HomeEmptyState` when `isEmpty`, otherwise the "Novo formulário" CTA + `HomeStats` + `RecentFormsList` + `TopFormsList` (respondidos) + `TopFormsList` (acessados no portal, conditional) + `NoResponsesCallout` (conditional)
- [x] 3.2 Wire the "Novo formulário" CTA — during implementation this was aligned to the codebase's existing create-form flow (`FormsTable` opens `SaveFormDetailsModal` rather than navigating straight to `/forms/builder`); the CTA now opens that same modal, which itself navigates to `/forms/builder/:id` once the form is created, keeping Home consistent with `MyForms`
- [x] 3.3 Add a loading state (skeleton or existing loading pattern) while `isLoadingForms` is true — reused the same `<p>Carregando...</p>` pattern as `FormDashboard`

## 4. Verification

- [x] 4.1 Run `pnpm --filter web lint` and `pnpm --filter web typecheck`
- [ ] 4.2 Manually verify in the dev server: zero-forms empty state, populated dashboard with recent/top-responded/no-response sections, and that "Mais acessados no portal" is hidden when no form has `clickCount > 0` — **not performed**: no browser automation tool is available in this session; ran `pnpm build` (tsc + vite build) instead as a compile/bundle sanity check, which passed
- [ ] 4.3 Verify navigating Home → Meus formulários does not trigger a duplicate `GET /forms` network call (shared query cache) — **not performed**: same limitation as 4.2, needs a browser with network inspection
