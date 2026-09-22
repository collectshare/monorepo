
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
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [draftFilterState, setDraftFilterState] = useState<FilterState>(EMPTY_FILTER_STATE);
  const [appliedFilterState, setAppliedFilterState] = useState<FilterState>(EMPTY_FILTER_STATE);

  const filteredResponses = useMemo(
    () => applyFilters(responses, appliedFilterState, questions ?? []),
    [responses, appliedFilterState, questions],
  );

  const activeConditionsCount = appliedFilterState.groups.reduce(
    (count, group) => count + group.conditions.length,
    0,
  );
  const isFilterActive = activeConditionsCount > 0;
  const appliedFilterKey = JSON.stringify(appliedFilterState);
  const hasFilterableQuestions = (questions ?? []).some((question) =>
    FILTERABLE_QUESTION_TYPES.includes(question.questionType),
  );
  const totalSubmissions = form?.submissionCount ?? responses.length;

  function handleApplyFilters() {
    setAppliedFilterState(draftFilterState);
    setIsFilterPanelOpen(false);
  }

  function handleClearFilters() {
    setDraftFilterState(EMPTY_FILTER_STATE);
    setAppliedFilterState(EMPTY_FILTER_STATE);
    setIsFilterPanelOpen(false);
  }

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
                {isFilterActive
                  ? `Mostrando ${filteredResponses.length} de ${totalSubmissions} respostas`
                  : `Total de respostas: ${totalSubmissions}`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {hasFilterableQuestions && (
                <Popover open={isFilterPanelOpen} onOpenChange={setIsFilterPanelOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline">
                      <FilterIcon className="size-4" /> Filtros
                      {isFilterActive && (
                        <Badge variant="secondary" className="ml-1 rounded-full px-1.5">
                          {activeConditionsCount}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="max-h-[80vh] w-[min(960px,95vw)] overflow-y-auto">
                    <SubmissionFilterBuilder
                      questions={questions ?? []}
                      filterState={draftFilterState}
                      onChange={setDraftFilterState}
                    />
                    <div className="mt-4 flex items-center justify-end gap-2 border-t pt-3">
                      <Button type="button" variant="ghost" size="sm" onClick={handleClearFilters}>
                        Limpar filtros
                      </Button>
                      <Button type="button" size="sm" onClick={handleApplyFilters}>
                        Aplicar filtros
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}

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
