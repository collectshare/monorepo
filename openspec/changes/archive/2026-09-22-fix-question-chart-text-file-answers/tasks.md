## 1. AnswersTable component

- [x] 1.1 Create `apps/web/src/views/pages/FormDashboard/components/AnswersTable.tsx` with `AnswersTableProps { question: IQuestion; responses: IFormSubmission[]; valueColumnTitle?: string; renderValue?: (value: string) => ReactNode }`.
- [x] 1.2 Build the non-aggregated `AnswerRow[]` rows via `useMemo`: one row per response with a non-empty answer for `question.id` (`submissionId`, `submittedAt`, `value` — join array values with `, `), no dedup by value.
- [x] 1.3 Render rows with `@monorepo/ui`'s `DataTable` (`pagination={{ pageIndex: 0, pageSize: 25 }}`), `DataTableTextFilter` (global search), `DataTableContent`, `DataTablePagination` — following the `FormsTable` composition.
- [x] 1.4 Define columns via `ColumnDef<AnswerRow>[]`: a "Data" column using `formatDate(row.original.submittedAt)` (cast to string) with `DataTableColumnHeader`, and a value column titled `valueColumnTitle ?? 'Resposta'` whose cell renders `renderValue ? renderValue(row.original.value) : row.original.value`.

## 2. Wire QuestionChart.tsx

- [x] 2.1 Import `AnswersTable` in `apps/web/src/views/pages/FormDashboard/components/QuestionChart.tsx`.
- [x] 2.2 Replace the `case QuestionType.TEXT` branch (currently the deduplicated `<table>` of `item.name`) with `<AnswersTable question={question} responses={responses} />`.
- [x] 2.3 Add a `case QuestionType.FILE` branch before `default`, rendering `<AnswersTable question={question} responses={responses} valueColumnTitle="Arquivo" renderValue={(value) => <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary underline">Baixar arquivo</a>} />`.
- [x] 2.4 Remove the now-unused local `IAnswer`/`IFormResponseWithAnswers` interfaces and the `responses as IFormResponseWithAnswers[]` cast if no longer referenced (the shared `data` reduce still needs `responses`/`answer.value` typed via `IFormSubmission`, which already carries `answers: Array<{questionId, value}>`).
- [x] 2.5 Confirm the aggregated `data` reduce and the `CHECKBOX`/`MULTIPLE_CHOICE`/`DROPDOWN`/`STARS` cases are untouched.

## 3. Verification

- [x] 3.1 Run `pnpm --filter web typecheck` — no new errors.
- [x] 3.2 Run `pnpm --filter web lint` — no new errors (2 pre-existing warnings, unrelated to this change).
- [ ] 3.3 Manually verify in the dev app: a TEXT question with duplicate identical answers shows one row per submission (not deduplicated).
- [ ] 3.4 Manually verify a FILE question renders an `AnswersTable` with "Baixar arquivo" links, one row per submission, no bar chart.
- [ ] 3.5 Manually verify CHECKBOX/MULTIPLE_CHOICE/DROPDOWN/STARS questions render unchanged.
- [ ] 3.6 Manually verify a TEXT or FILE question with zero responses shows the `DataTable` empty state.
