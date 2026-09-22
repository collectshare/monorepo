
import { IQuestion } from '@monorepo/shared/types/IQuestion';
import { Button } from '@monorepo/ui';
import { DownloadIcon } from 'lucide-react';

import PageLayout from '../../layouts/PageLayout';
import { QuestionChart } from './components';
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

            <Button onClick={() => handleExport()} disabled={totalSubmissions === 0 || isExporting}>
              <DownloadIcon />
              {isExporting ? 'Exportando...' : 'Exportar CSV'}
            </Button>
          </div>

          {exceedsLimit && (
            <div className="mt-4 rounded-lg border p-4 bg-amber-50 dark:bg-amber-950">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Este formulário tem {totalSubmissions} respostas. O dashboard exibe apenas as primeiras{' '}
                {DASHBOARD_SUBMISSIONS_LIMIT}. Para ver todas as respostas, exporte o CSV.
              </p>
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {questions?.map((question: IQuestion) => (
              <QuestionChart
                key={question.id}
                question={question}
                responses={responses}
              />
            ))}
          </div>
        </div>
      )}
    </PageLayout>
  );
}
