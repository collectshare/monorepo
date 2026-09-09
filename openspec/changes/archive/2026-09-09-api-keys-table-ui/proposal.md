## Why

The API Keys screen currently renders as a single stacked form-and-list page, inconsistent with the "Meus formulários" (Forms) screen, which uses a proper data table (`DataTable`) with filtering, pagination, and a modal-based creation flow. Aligning API Keys with that pattern gives a consistent UX across the app and scales better as the number of keys grows.

## What Changes

- Replace the inline "Criar nova API Key" form and flat list on the API Keys page with a `DataTable` (matching `FormsTable`), showing columns for name, key prefix, scopes, and creation date.
- Add an "Nova API Key" insert button above the table (matching the Forms "Novo formulário" button style/position) that opens a modal via the existing `useModal` hook.
- Move the API Key creation form (name input, submit) into the modal component; the modal also displays the newly created secret key (with copy-to-clipboard) and a "reveal only once" warning after successful creation, replacing the current inline amber callout.
- Move revoke-key action into a row-level actions column (dropdown menu with a "Revogar" item), matching the `Ellipsis` dropdown pattern used in `FormsTable` columns, instead of an inline trash icon button.
- Preserve existing data-fetching/mutation logic (`useApiKeysController`, `apiKeysService`) — this is a UI/structure change, not a backend or data-contract change.

## Capabilities

### New Capabilities
- `api-keys-management-ui`: Screen behavior for listing, creating (via modal), and revoking personal API keys using the shared data-table UI pattern.

### Modified Capabilities
(none — no existing specs for this area)

## Impact

- Affected files: `apps/web/src/views/pages/ApiKeys/index.tsx`, `apps/web/src/views/pages/ApiKeys/useApiKeysController.ts`.
- New files: an `ApiKeysTable` component (table + insert button + columns), and a `CreateApiKeyModal` component (form + created-key reveal), colocated under `apps/web/src/views/pages/ApiKeys/components/`.
- No changes to `apiKeysService`, API routes, or backend contracts.
- No changes to routing (`/api-keys` path stays the same).
