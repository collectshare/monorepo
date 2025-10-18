
import PageLayout from '../../layouts/PageLayout';
import { QuestionChart } from './components';
import { useFormDashboardController } from './useFormDashboardController';

export default function FormDashboard() {
  const {
    form,
    isLoadingForm,
    questions,
    responses,
    isLoadingResponses,
  } = useFormDashboardController();

  return (
    <PageLayout
      title={form?.title ?? ''}
      subtitle="Visualize as respostas do seu formulário"
    >
      {(isLoadingForm || isLoadingResponses) && <p>Carregando...</p>}
      {!isLoadingForm && !form && <p>Formulário não encontrado</p>}

      {form && (
        <div className="mt-4">
          <h2 className="text-2xl font-bold tracking-tight">Respostas</h2>
          <p className="text-muted-foreground">
            Total de respostas: {responses.length}
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {questions?.map((question) => (
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
