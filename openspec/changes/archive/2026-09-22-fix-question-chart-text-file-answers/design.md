## Context

`FormDashboard` renders each form question via `QuestionChart.tsx` (`apps/web/src/views/pages/FormDashboard/components/QuestionChart.tsx`). To build bar/pie charts for choice-style questions, the component reduces all responses into one array:

```tsx
const data = (responses as IFormResponseWithAnswers[]).reduce((acc, response) => {
  const answer = response.answers.find((a) => a.questionId === question.id);
  if (!answer?.value) return acc;
  // ...aggregates currentAnswerValues into acc, deduplicating by value:
  const existing = acc.find((item) => item.name === value);
  if (existing) { existing.value += 1; } else { acc.push({ name: value, value: 1 }); }
  return acc;
}, [] as { name: string; value: number }[]);
```

This dedup-and-count shape is correct for `CHECKBOX`, `MULTIPLE_CHOICE`, `DROPDOWN`, `STARS` — a fixed set of possible values where counting occurrences is exactly what a bar/pie chart needs.

Two question types reuse this same `data` array incorrectly:

- **`TEXT`**: the existing case prints only `item.name`, so two respondents who typed the exact same string collapse into a single deduplicated row — the count (and every duplicate occurrence past the first) is silently dropped. Reported symptom: "quando o texto é exatamente o mesmo ele acaba mostrando somente um."
- **`FILE`**: there is no `case QuestionType.FILE` in `renderChart()`'s switch, so it falls into `default: return <Chart data={data} />`. Each FILE answer's `value` is an S3 signed URL, generated per-submission by `GetFormSubmissionsUseCase` via `StorageGateway.getSignedUrl` (`apps/api/src/infra/gateways/StorageGateway.ts`, 15-minute expiry) — always unique, so `data` never actually dedupes, but the result is a meaningless bar chart with one bar of height 1 per submission. `answer.value` for a FILE question already arrives at the frontend as a ready-to-use signed URL; no further resolution is needed client-side.

## Goals / Non-Goals

**Goals:**
- Show one row per submission (no aggregation, no dedup-by-value) for `TEXT` and `FILE` answers.
- Reuse the shared `@monorepo/ui` `DataTable` primitives so search/pagination behavior is consistent with the rest of the app (e.g. `apps/web/src/views/pages/MyForms/components/FormsTable`), rather than the current bespoke `<table>` markup.
- Keep `CHECKBOX` / `MULTIPLE_CHOICE` / `DROPDOWN` / `STARS` behavior byte-for-byte unchanged — they are not affected by either bug.
- Turn `FILE` answers into a downloadable-link table instead of a bar chart.

**Non-Goals:**
- Per-question CSV export button — future iteration.
- Extra metadata columns (IP, user agent, etc.) per response — future iteration.
- Any change to how the API generates or stores signed URLs — this is a frontend rendering fix only, and the API side is already correct.
- Changing the aggregation `data` reduce used by the chart types — it stays exactly as-is.

## Decisions

**One shared `AnswersTable` component, not two.** `TEXT` and `FILE` differ only in the value column's title and how the value renders (plain text vs. a download link), and duplicating a `DataTable` wiring (columns, pagination, filter) twice would be pure repetition of the same logic. A single component in `apps/web/src/views/pages/FormDashboard/components/AnswersTable.tsx`, parameterized by `valueColumnTitle` and an optional `renderValue`, covers both. This follows the existing convention in the same folder of one component per visualization type (`Chart.tsx`, `PieChart.tsx`, `StarRatingChart.tsx`).

```ts
interface AnswerRow {
  submissionId: string;
  submittedAt: string;
  value: string;
}

interface AnswersTableProps {
  question: IQuestion;
  responses: IFormSubmission[];
  valueColumnTitle?: string; // default: "Resposta"
  renderValue?: (value: string) => ReactNode; // default: plain text
}
```

**Build rows independently of the existing `data` reduce.** `AnswersTable` computes its own `useMemo`'d, non-aggregated row list — one row per response with a non-empty answer for that question — rather than trying to adapt the shared/deduplicated `data` array, since that array has already discarded the information (counts, duplicate rows) this fix needs to recover:

```ts
responses.reduce<AnswerRow[]>((acc, response) => {
  const answer = response.answers.find((a) => a.questionId === question.id);
  if (!answer?.value) return acc;
  const value = Array.isArray(answer.value) ? answer.value.join(', ') : answer.value;
  if (!value) return acc;
  acc.push({ submissionId: response.id, submittedAt: String(response.submittedAt), value });
  return acc;
}, []);
```

**Reuse `@monorepo/ui` `DataTable` family, not a hand-rolled `<table>`.** `DataTable`/`DataTableColumnHeader`/`DataTableContent`/`DataTableTextFilter`/`DataTablePagination` already provide search + pagination and are the established pattern (`FormsTable`). Columns: "Data" (via `formatDate`, `apps/web/src/app/utils/formatDate.ts`) and the value column (title/render customizable via props). Page size: 25 items, matching the system default used elsewhere.

**`QuestionChart.tsx` changes are additive only.** The `data` reduce and the existing `CHECKBOX`/`MULTIPLE_CHOICE`/`DROPDOWN`/`STARS` cases are untouched. Only `case QuestionType.TEXT` is redefined (from the current dedup `<table>` to `<AnswersTable question={question} responses={responses} />`) and a new `case QuestionType.FILE` is added before the `default` fallthrough, rendering `AnswersTable` with a "Arquivo" column title and a `renderValue` that wraps the value in an `<a href={value} target="_blank" rel="noopener noreferrer">Baixar arquivo</a>` link.

## Risks / Trade-offs

- **[Risk]** A form with a very large number of submissions renders every row into `AnswersTable`'s `useMemo`, unlike the aggregated chart path which caps at the number of distinct values. → **Mitigation**: `DataTable`'s built-in client-side pagination (25/page) already keeps the rendered DOM small; this matches how `FormsTable` already handles large submission counts, no server-side pagination needed for this fix.
- **[Risk]** Signed URLs used directly as `renderValue` links expire ~15 minutes after the dashboard data was fetched, so a stale open tab's "Baixar arquivo" link could 403 on click. → **Mitigation**: pre-existing behavior (the current bar-chart default case has the same staleness issue today); out of scope to fix URL refresh here.
- **[Trade-off]** `AnswersTable`'s row-building duplicates the "find matching answer for this question" lookup that also happens in the `data` reduce above it in `QuestionChart.tsx`. Accepted because merging the two would couple the aggregated-chart path to the raw-table path and make both harder to reason about independently; the duplication is a few lines and question-scoped, not response-set-scoped.

## Migration Plan

Frontend-only change, no data migration. Ship as a normal `apps/web` deploy; safe to roll back independently by reverting the two changed files (`QuestionChart.tsx` edit, new `AnswersTable.tsx` file) since no API or schema changes are involved.

## Open Questions

None — the fix is scoped to two files with no external dependencies or ambiguous behavior.
