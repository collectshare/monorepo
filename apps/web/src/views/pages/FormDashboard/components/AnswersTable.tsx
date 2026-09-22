import { IFormSubmission } from '@monorepo/shared/types/IFormSubmission';
import { IQuestion } from '@monorepo/shared/types/IQuestion';
import {
  DataTable,
  DataTableColumnHeader,
  DataTableContent,
} from '@monorepo/ui';
import type { ColumnDef } from '@tanstack/react-table';
import { ReactNode, useMemo } from 'react';

import { formatDate } from '@/app/utils/formatDate';

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
        accessorKey: 'value',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={valueColumnTitle ?? 'Resposta'} />
        ),
        cell: ({ row }) => (renderValue ? renderValue(row.original.value) : row.original.value),
        enableResizing: false,
        enableHiding: false,
      },
      {
        accessorKey: 'submissionId',
        header: ({ column }) => <DataTableColumnHeader column={column} title="ID da submissão" />,
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
        pageSize: data.length || 1,
      }}
    >
      <div className="flex h-[400px] flex-col">
        <div className="min-h-0 flex-1 mt-2">
          <DataTableContent isLoading={false} />
        </div>
      </div>
    </DataTable>
  );
}
