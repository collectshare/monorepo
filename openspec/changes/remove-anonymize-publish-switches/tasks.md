## 1. Shared + API model

- [x] 1.1 Remove `isAnonymous` and `isPublished` from `packages/shared/entities/Form.ts` (fields, constructor and `Attributes`)
- [x] 1.2 Remove them from `FormItem` (`ItemType`, `fromEntity`, `toEntity`)
- [x] 1.3 Remove them from `createFormSchema`, `updateFormSchema`, `CreateFormUseCase` and `UpdateFormDetailsUseCase`
- [x] 1.4 Update the `UpdateFormTool` description (MCP) so it no longer mentions the flags

## 2. API behavior

- [x] 2.1 Drop the `!form.isPublished` checks in `GetPublishedFormQuery`, `GetPublishedFormDataController`, `ExportPublishedFormDataController` and `ExternalGetPublishedFormDataController`, keeping the `!form` check
- [x] 2.2 In `OnFormChangedUseCase`, remove the delete branch so it always upserts
- [x] 2.3 In `SubmitFormUseCase`, always store `ip: null` and `userAgent: null`, and remove the now-unused inputs if nothing else reads them
- [x] 2.4 Fix the tests: `UpdateFormDetailsUseCase.test`, `tools.test`, `ExternalCreateFormController.test`, `ExternalUpdateFormController.test` and `ExternalGetPublishedFormDataController.test`. Replace the "unpublished → 404" cases with "missing → 404". Add a check that a submission stores a null ip and userAgent
- [x] 2.5 Run `pnpm --filter @monorepo/api typecheck` and `test`

## 3. Data script

- [x] 3.1 Rename `scripts/backfillFormIsPublished.ts` to `scripts/cleanupFormFlags.ts`. It filters `type = Form AND (attribute_exists(isPublished) OR attribute_exists(isAnonymous))` and runs `REMOVE isPublished, isAnonymous`
- [x] 3.2 In `apps/api/package.json`, replace `backfill:form-published` with `cleanup:form-flags`
- [x] 3.3 Remove `isPublished: false` from `scripts/verifyMcpServer.ts`

## 4. Web

- [x] 4.1 In `SaveFormDetailsModal/index.tsx`, remove both switch blocks and the helper text, and fix the `tabIndex` sequence
- [x] 4.2 In `useSaveFormDetailsModalController.ts` and `formsService/save.ts`, remove the fields
- [x] 4.3 Home:
  - Remove `publishedCount` and `draftCount` from `useHomeController` and `index.tsx`.
  - Remove the "Publicados / Rascunho" card from `HomeStats`.
  - Make the "sem respostas" filter `submissionCount === 0`.
- [x] 4.4 Run `pnpm --filter @monorepo/web typecheck` and `lint`

## 5. Contract + docs

- [x] 5.1 In `apps/portal/public/openapi.yaml`, remove the flags from the create, update and form schemas (including `required`) and from the `PUT` description
- [x] 5.2 In `CLAUDE.md`, `README.md` and `README.en.md`:
  - Remove `isPublished` / "opt-out default" and `backfill:form-published`.
  - Document `cleanup:form-flags`.
  - Say that every form is anonymous and public.

## 6. Rollout

- [ ] 6.1 Deploy the API to dev, run `cleanup:form-flags`, and check that the portal and Algolia list the forms that were unpublished
- [ ] 6.2 Repeat for prod after release
