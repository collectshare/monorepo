import { ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react';
import { FormProvider } from 'react-hook-form';

import { useTheme } from '@/app/hooks/useTheme';
import { GetByIdResponse } from '@/app/services/formsService/getForm';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';

import { FormField } from './components/FormField';
import { FormFinished } from './components/FormFinished';
import { useFormResponseController } from './useFormResponseController';

interface FormResponseProps {
  formEntity: GetByIdResponse;
}

export default function FormResponse({ formEntity }: FormResponseProps) {
  const {
    form,
    isLoadingSubmit,
    handleSubmit,
    currentQuestion,
    goToNextQuestion,
    goToPreviousQuestion,
    isFirstQuestion,
    isLastQuestion,
    progress,
    totalQuestions,
    currentQuestionIndex,
    isFinished,
  } = useFormResponseController({ formEntity });

  const { theme, toggleTheme } = useTheme();

  return (
    <FormProvider {...form}>
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Button
          variant="outline"
          size="icon"
          className="absolute top-4 right-4"
          onClick={toggleTheme}
        >
          {theme === 'light' ? (
            <Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          ) : (
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          )}
        </Button>

        {isFinished ? (
          <FormFinished />
        ) : (
          <div className="my-auto w-full max-w-2xl flex flex-col gap-10">
            <header>
              <h1 className="text-2xl font-bold tracking-tight text-center">
                {formEntity?.form.title}
              </h1>
              {formEntity?.form.description && (
                <p className="text-center text-muted-foreground mt-2">
                  {formEntity?.form.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-6">
                <Progress value={progress} className="w-full" />
                <span className="text-sm font-medium text-muted-foreground">
                  {Math.round(progress)}%
                </span>
              </div>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Pergunta {currentQuestionIndex + 1} de {totalQuestions}
              </p>
            </header>

            <main className="flex-grow flex items-center justify-center">
              <form
                id="form-response"
                onSubmit={(e) => e.preventDefault()}
                className="w-full"
              >
                {currentQuestion && (
                  <div
                    key={currentQuestion.id}
                    className="flex flex-col items-center text-center"
                  >
                    <FormField question={currentQuestion} />
                  </div>
                )}
              </form>
            </main>

            <footer className="mt-8 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={goToPreviousQuestion}
                disabled={isFirstQuestion || isLoadingSubmit}
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>

              {!isLastQuestion && (
                <Button onClick={goToNextQuestion}>
                  Próximo
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}

              {isLastQuestion && (
                <Button onClick={handleSubmit} disabled={isLoadingSubmit}>
                  Enviar
                </Button>
              )}
            </footer>
          </div>
        )}
      </div>
    </FormProvider>
  );
}
