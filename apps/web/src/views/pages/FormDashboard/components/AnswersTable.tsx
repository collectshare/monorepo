import { IFormSubmission } from '@monorepo/shared/types/IFormSubmission';
import { IQuestion } from '@monorepo/shared/types/IQuestion';
import {
  DataTable,
  DataTableColumnHeader,
  DataTableContent,
  DataTableTextFilter,
} from '@monorepo/ui';
import type { ColumnDef } from '@tanstack/react-table';
import { ReactNode, useMemo } from 'react';

import { formatDate } from '@/app/utils/formatDate';

const MAX_ROWS = 500;

interface AnswerRow {
  submissionId: string;
  submittedAt: string;
  value: string;
}

interface AnswersTableProps {
  question: IQuestion;
  responses: IFormSubmission[];
  valueColumnTitle?: string;
  renderValue?: (value: string) => ReactNode;
}

export function AnswersTable({ question, responses, valueColumnTitle, renderValue }: AnswersTableProps) {
  const data = useMemo(
    () =>
      responses.reduce<AnswerRow[]>((acc, response) => {
        const answer = response.answers.find((a) => a.questionId === question.id);

        if (!answer?.value) {
          return acc;
        }

        const value = Array.isArray(answer.value) ? answer.value.join(', ') : answer.value;

        if (!value) {
          return acc;
        }

        acc.push({
          submissionId: response.id,
          submittedAt: String(response.submittedAt),
          value,
        });

        return acc;
      }, []),
    [question.id, responses],
  );

  const columns = useMemo<ColumnDef<AnswerRow>[]>(
    () => [
      {
        accessorKey: 'submissionId',
        header: ({ column }) => <DataTableColumnHeader column={column} title="ID da submissão" />,
        enableResizing: false,
        enableHiding: false,
      },
      {
        accessorKey: 'value',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={valueColumnTitle ?? 'Resposta'} />
        ),
        cell: ({ row }) => (renderValue ? renderValue(row.original.value) : row.original.value),
        enableResizing: false,
        enableHiding: false,
      },
      {
        accessorKey: 'submittedAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Data" />,
        cell: ({ row }) => formatDate(row.original.submittedAt),
        enableResizing: false,
        enableHiding: false,
      },
    ],
    [valueColumnTitle, renderValue],
  );

  return (
    <DataTable
      data={data}
      columns={columns}
      pagination={{
        pageIndex: 0,
        pageSize: MAX_ROWS,
      }}
    >
      <div className="mb-4">
        <DataTableTextFilter className="max-w-[350px] w-[350px]" placeholder="Filtrar respostas..." />
      </div>
      <DataTableContent isLoading={false} />
    </DataTable>
  );
}
