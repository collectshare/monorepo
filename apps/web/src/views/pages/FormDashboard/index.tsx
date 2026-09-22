
import { IQuestion } from '@monorepo/shared/types/IQuestion';
import { Badge, Button, Popover, PopoverContent, PopoverTrigger } from '@monorepo/ui';
import { ChartColumnIcon, DownloadIcon, FilterIcon, TableIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import PageLayout from '../../layouts/PageLayout';
import { AllResponsesTable, QuestionChart, SubmissionFilterBuilder } from './components';
import { applyFilters } from './filters/applyFilters';
import { EMPTY_FILTER_STATE, FILTERABLE_QUESTION_TYPES, FilterState } from './filters/types';
import { useFormDashboardController } from './useFormDashboardController';

export default function FormDashboard() {
  const {
    form,
    isLoadingForm,
    questions,
    responses,
    isLoadingResponses,
    handleExport,
    isExporting,
  } = useFormDashboardController();

  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  const totalSubmissions = form?.submissionCount ?? responses.length;
  const exceedsLimit = totalSubmissions > DASHBOARD_SUBMISSIONS_LIMIT;

  return (
    <PageLayout
      title={form?.title ?? ''}
      subtitle="Visualize as respostas do seu formulário"
    >
      {(isLoadingForm || isLoadingResponses) && <p>Carregando...</p>}
      {!isLoadingForm && !form && <p>Formulário não encontrado</p>}

      {form && (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Respostas</h2>
              <p className="text-muted-foreground">
                Total de respostas: {totalSubmissions}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setViewMode((mode) => (mode === 'chart' ? 'table' : 'chart'))}
              >
                {viewMode === 'chart' ? (
                  <>
                    <TableIcon className="size-4" /> Ver todas as respostas em tabela
                  </>
                ) : (
                  <>
                    <ChartColumnIcon className="size-4" /> Ver gráficos
                  </>
                )}
              </Button>

              <Button onClick={() => handleExport()} disabled={totalSubmissions === 0 || isExporting}>
                <DownloadIcon />
                {isExporting ? 'Exportando...' : 'Exportar CSV'}
              </Button>
            </div>
          </div>

          {viewMode === 'table' ? (
            <div className="mt-4">
              <AllResponsesTable
                key={appliedFilterKey}
                questions={questions ?? []}
                responses={filteredResponses}
              />
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {questions?.map((question: IQuestion) => (
                <QuestionChart
                  key={`${question.id}-${appliedFilterKey}`}
                  question={question}
                  responses={filteredResponses}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </PageLayout>
  );
}
