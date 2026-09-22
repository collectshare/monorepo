
import { IQuestion } from '@monorepo/shared/types/IQuestion';
import { Button } from '@monorepo/ui';
import { ChartColumnIcon, DownloadIcon, TableIcon } from 'lucide-react';
import { useState } from 'react';

import PageLayout from '../../layouts/PageLayout';
import { AllResponsesTable, QuestionChart } from './components';
import { useFormDashboardController } from './useFormDashboardController';

const DASHBOARD_SUBMISSIONS_LIMIT = 500;

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

          {exceedsLimit && (
            <div className="mt-4 rounded-lg border p-4 bg-amber-50 dark:bg-amber-950">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Este formulário tem {totalSubmissions} respostas. O dashboard exibe apenas as primeiras{' '}
                {DASHBOARD_SUBMISSIONS_LIMIT}. Para ver todas as respostas, exporte o CSV.
              </p>
            </div>
          )}

          {viewMode === 'table' ? (
            <div className="mt-4">
              <AllResponsesTable questions={questions ?? []} responses={responses} />
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {questions?.map((question: IQuestion) => (
                <QuestionChart
                  key={question.id}
                  question={question}
                  responses={responses}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </PageLayout>
  );
}
