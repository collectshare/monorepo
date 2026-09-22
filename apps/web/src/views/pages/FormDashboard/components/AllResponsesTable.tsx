
import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import { IFormSubmission } from '@monorepo/shared/types/IFormSubmission';
import { IQuestion } from '@monorepo/shared/types/IQuestion';
import {
  DataTable,
  DataTableColumnHeader,
  DataTableColumnsVisibilityDropDown,
  DataTableContent,
  DataTablePagination,
  DataTableTextFilter,
} from '@monorepo/ui';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

import { formatDate } from '@/app/utils/formatDate';

interface ResponseRow {
  submissionId: string;
  submittedAt: string;
  [questionId: string]: string;
}

interface AllResponsesTableProps {
  questions: IQuestion[];
  responses: IFormSubmission[];
}

function formatAnswerValue(value: string | string[] | undefined): string {
  if (!value) {
    return '';
  }

  return Array.isArray(value) ? value.join(', ') : value;
}

export function AllResponsesTable({ questions, responses }: AllResponsesTableProps) {
  const data = useMemo<ResponseRow[]>(
    () =>
      responses.map((response) => {
        const row: ResponseRow = {
          submissionId: response.id,
          submittedAt: String(response.submittedAt),
        };

        questions.forEach((question) => {
          const answer = response.answers.find((a) => a.questionId === question.id);
          row[question.id] = formatAnswerValue(answer?.value);
        });

        return row;
      }),
    [questions, responses],
  );

  const columns = useMemo<ColumnDef<ResponseRow>[]>(
    () => [
      {
        accessorKey: 'submissionId',
        header: ({ column }) => <DataTableColumnHeader column={column} title="ID da submissão" />,
        enableResizing: false,
        meta: { nameInFilters: 'ID da submissão' },
      },
      {
        accessorKey: 'submittedAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Data" />,
        cell: ({ row }) => formatDate(row.original.submittedAt),
        enableResizing: false,
        enableHiding: false,
        meta: { nameInFilters: 'Data' },
      },
      ...questions.map<ColumnDef<ResponseRow>>((question) => ({
        accessorKey: question.id,
        header: ({ column }) => <DataTableColumnHeader column={column} title={question.text} />,
        cell: ({ row }) => {
          const value = row.original[question.id];

          if (question.questionType === QuestionType.FILE && value) {
            return (
              <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                Baixar arquivo
              </a>
            );
          }

          return value;
        },
        enableResizing: false,
        meta: { nameInFilters: question.text },
      })),
    ],
    [questions],
  );

  return (
    <DataTable
      data={data}
      columns={columns}
      pagination={{
        pageIndex: 0,
        pageSize: 25,
      }}
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <DataTableTextFilter className="max-w-[350px] w-[350px]" placeholder="Filtrar respostas..." />
        <DataTableColumnsVisibilityDropDown />
      </div>
      <div className="overflow-auto rounded-md border">
        <DataTableContent isLoading={false} />
      </div>
      <div className="flex justify-end mt-4">
        <DataTablePagination />
      </div>
    </DataTable>
  );
}
