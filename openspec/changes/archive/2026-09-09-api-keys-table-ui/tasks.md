## 1. Component scaffolding

- [x] 1.1 Create `apps/web/src/views/pages/ApiKeys/components/ApiKeysTable/columns.tsx` defining `ColumnDef<ApiKeySummary>[]` for name, key prefix, scopes, and creation date, following `MyForms/components/FormsTable/columns.tsx` header/style conventions.
- [x] 1.2 Add an `actions` column to `columns.tsx` with an `Ellipsis`-triggered `DropdownMenu` containing a "Revogar" item, wired to the row's revoke handler and disabled while revoking.
- [x] 1.3 Create `apps/web/src/views/pages/ApiKeys/components/ApiKeysTable/index.tsx` rendering `DataTable` + `DataTableTextFilter` + insert `Button` ("Nova API Key", `CirclePlusIcon`) + `DataTableContent` + `DataTablePagination`, following `FormsTable/index.tsx`.
- [x] 1.4 Create `apps/web/src/views/pages/ApiKeys/components/CreateApiKeyModal/index.tsx` containing the "Criar nova API Key" form (name input, submit button) and the post-creation secret reveal block (copy-to-clipboard, "Entendi, pode fechar" button), following `SaveFormDetailsModal`'s `DialogHeader`/`DialogFooter` structure.

## 2. Wire up state and behavior

- [x] 2.1 Update `apps/web/src/views/pages/ApiKeys/useApiKeysController.ts` if needed so all state (`apiKeys`, `isLoading`, `createdKey`, `setCreatedKey`, `register`, `handleSubmit`, `errors`, `isCreating`, `revoke`, `isRevoking`) required by both `ApiKeysTable` and `CreateApiKeyModal` remains available from a single controller call.
- [x] 2.2 Wire the insert button in `ApiKeysTable` to `useModal().open(<CreateApiKeyModal />)`, matching how `FormsTable` opens `SaveFormDetailsModal`.
- [x] 2.3 Pass `revoke`/`isRevoking` (or equivalent per-row handlers) from the table into `columns.tsx`'s actions cell, matching how `FormsTable/columns.tsx` accesses `useModal`/`useNavigate` inside the cell renderer.
- [x] 2.4 Ensure `CreateApiKeyModal` closes only via explicit user action (submit does not auto-close while `createdKey` is set; the "Entendi" control calls `close()` and resets `createdKey` via `setCreatedKey(null)`).

## 3. Rewrite the page shell

- [x] 3.1 Rewrite `apps/web/src/views/pages/ApiKeys/index.tsx` to use `PageLayout` (title "API Keys", subtitle "Gerencie chaves de acesso pessoal (PAT) da sua conta.") wrapping `ApiKeysTable`, removing the old inline form/list/callout markup.
- [x] 3.2 Remove now-unused imports/markup from the old `index.tsx` (e.g., inline `Trash2Icon` button, amber callout block) once their logic has moved into the new components.

## 4. Verification

- [x] 4.1 Run `pnpm --filter web typecheck` and `pnpm --filter web lint` and fix any issues.
- [ ] 4.2 Manually test in the dev server: empty state, creating a key (reveal + copy + dismiss), filtering/pagination with multiple keys, and revoking a key from the row actions menu.
