## Context

The API Keys screen (`apps/web/src/views/pages/ApiKeys/index.tsx`) currently renders a create-form, a "just created" reveal callout, and a flat list in one stacked column. The Forms screen (`apps/web/src/views/pages/MyForms/`) already established the target pattern in this codebase: a `PageLayout` wrapper, a `DataTable` from `@monorepo/ui` with a `DataTableTextFilter` + insert `Button` header row, `DataTableContent`, `DataTablePagination`, and a modal (via `useModal`/`ModalContext`) hosting the create/edit form. This change ports API Keys onto that same pattern.

## Goals / Non-Goals

**Goals:**
- Visual/structural parity with `FormsTable`: same `DataTable` primitives, same insert-button placement and icon (`CirclePlusIcon`), same row-actions dropdown pattern (`Ellipsis` trigger + `DropdownMenu`).
- Move the create form into a modal opened via `useModal().open(...)`, reusing the existing `useApiKeysController` mutation logic.
- Keep the "reveal secret once" UX, but inside the modal instead of inline on the page.
- Keep revoke behavior, moved into a row actions dropdown item instead of a standalone icon button.

**Non-Goals:**
- No backend/API changes — `apiKeysService` (`listApiKeys`, `createApiKey`, `revokeApiKey`) and its contracts are unchanged.
- No new features (e.g., scope editing UI, key rotation, expiry) — `scopes` is displayed read-only if included, not edited.
- No changes to routing or navigation entry points for `/api-keys`.

## Decisions

- **Split into `ApiKeysTable` + `CreateApiKeyModal` components**, mirroring `MyForms/components/FormsTable` + `FormBuilder/components/SaveFormDetailsModal`. This keeps `ApiKeys/index.tsx` a thin page shell (`PageLayout` + `ApiKeysTable`), consistent with `MyForms/index.tsx`.
  - Alternative considered: keep everything in one file. Rejected — breaks parity with the Forms pattern and mixes table/column concerns with modal form concerns.
- **Columns**: Name, Key prefix (`keyPrefix…`, monospace), Scopes (if non-empty, rendered as badges/comma list; otherwise "-"), Criada em (formatted date via existing `formatDate` util). Actions column on the right with a dropdown containing "Revogar".
  - Alternative considered: keep the trash-icon button directly in the row. Rejected in favor of the `Ellipsis`/`DropdownMenu` pattern already established in `FormsTable/columns.tsx`, for visual and interaction parity.
- **Modal content stays driven by `useApiKeysController`**: the modal component takes no props (no edit mode exists for API keys — keys are immutable once created), calls `register`/`handleSubmit`/`errors`/`isCreating` from the controller, and renders the `createdKey` reveal block conditionally in place of (or below) the form, closing via `useModal().close()`.
  - Alternative considered: fetch a separate created-key state inside the modal itself. Rejected — `useApiKeysController` already owns this state (`createdKey`/`setCreatedKey`); reusing it avoids duplicating query invalidation logic.
- **No confirmation dialog added for revoke**, matching current behavior (immediate revoke on click) — out of scope for a pure layout/structure change. If desired, that would be a separate follow-up change.

## Risks / Trade-offs

- [Losing the "reveal once" callout visibility if the modal auto-closes on success] → Mitigation: the modal does not auto-close after key creation; it only closes when the user clicks "Fechar"/"Entendi" (mirrors current inline behavior where the callout persists until dismissed).
- [Table pattern (`DataTable`) expects paginated/filterable data; API keys lists are typically small] → Mitigation: this is purely presentational — an empty or short list still renders correctly in `DataTable`, matching how `FormsTable` already handles small datasets.

## Migration Plan

- Single-PR UI refactor, no data migration. Deploy via normal `apps/web` build/deploy; no feature flag needed since behavior (list/create/revoke) is unchanged, only the visual structure.
- Rollback: revert the PR; no persisted state or API contracts are touched.

## Open Questions

- Should `scopes` be shown as a column at all, given the current create form doesn't let users pick scopes (always defaults)? Decision: show it read-only for future-proofing since the type already exists (`ApiKeySummary.scopes`); if empty for all rows, it still renders harmlessly as "-".
