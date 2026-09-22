
import { IQuestion } from '@monorepo/shared/types/IQuestion';
import { Badge, Button, buttonVariants, Popover, PopoverContent, PopoverTrigger } from '@monorepo/ui';
import { ChartColumnIcon, CopyIcon, DownloadIcon, FilterIcon, PencilIcon, TableIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

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

  function handleCopyLink() {
    if (!form) {return;}
    const url = `${window.location.origin}/forms/response/${form.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado para a área de transferência');
  }

  return (
    <div className="h-full flex-1 flex-col md:flex">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">{form?.title ?? ''}</h2>
          {form && (
            <span className="text-muted-foreground text-sm">
              {isFilterActive
                ? `Mostrando ${filteredResponses.length} de ${totalSubmissions} respostas`
                : `Total de respostas: ${totalSubmissions}`}
            </span>
          )}
        </div>

        {form && (
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={handleCopyLink}>
              <CopyIcon className="size-4" /> Copiar link
            </Button>

            <Link
              to={`/forms/builder/${form.id}`}
              className={buttonVariants({ variant: 'outline', className: 'flex items-center gap-2' })}
            >
              <PencilIcon className="size-4" /> Editar
            </Link>
          </div>
        )}
      </div>

      {(isLoadingForm || isLoadingResponses) && <p>Carregando...</p>}
      {!isLoadingForm && !form && <p>Formulário não encontrado</p>}

      {form && (
        <div className="mt-4">
          <div className="flex items-center justify-between">
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

            </div>
            <Button onClick={() => handleExport()} disabled={totalSubmissions === 0 || isExporting}>
              <DownloadIcon />
              {isExporting ? 'Exportando...' : 'Exportar CSV'}
            </Button>
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
    </div>
  );
}
