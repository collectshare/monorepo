import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { DatasetRow, portalService } from '@/app/services/portalService';

export function useDatasetController() {
  const { formId = '' } = useParams<{ formId: string }>();

  const { data: dataset, isLoading: isLoadingDataset } = useQuery({
    queryKey: ['portal-dataset', formId],
    queryFn: () => portalService.getDataset(formId),
    enabled: !!formId,
  });

  const {
    data,
    isLoading: isLoadingData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['portal-dataset-data', formId],
    queryFn: ({ pageParam }: { pageParam?: string }) => portalService.getDatasetData({ formId, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!formId,
  });

  const rows = useMemo<DatasetRow[]>(() => data?.pages.flatMap((page) => page.rows) ?? [], [data]);

  const columns = useMemo<ColumnDef<DatasetRow>[]>(() => {
    const questions = (dataset?.questions ?? [])
      .filter((question) => question.questionType !== QuestionType.FILE)
      .sort((a, b) => a.order - b.order);

    const questionColumns: ColumnDef<DatasetRow>[] = questions.map((question) => ({
      id: question.id,
      header: question.text,
      accessorFn: (row) => {
        const answer = row.answers.find((a) => a.questionId === question.id);
        return Array.isArray(answer?.value) ? answer.value.join(', ') : (answer?.value ?? '');
      },
    }));

    return [
      {
        id: 'submittedAt',
        header: 'Enviado em',
        accessorFn: (row) => new Date(row.submittedAt).toLocaleString('pt-BR'),
      },
      ...questionColumns,
    ];
  }, [dataset?.questions]);

  return {
    formId,
    dataset,
    isLoadingDataset,
    rows,
    columns,
    isLoadingData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
