import { Moon, Sun } from 'lucide-react';
import { FormProvider } from 'react-hook-form';

import { useTheme } from '@/app/hooks/useTheme';
import { GetByIdResponse } from '@/app/services/formsService/getForm';
import { Button } from '@/components/ui/Button';

import { FormField } from './components/FormField';
import { FormFinished } from './components/FormFinished';
import { useSinglePageFormController } from './useSinglePageFormController';

interface SinglePageFormProps {
  formEntity: GetByIdResponse;
}

export default function SinglePageForm({ formEntity }: SinglePageFormProps) {
  const {
    form,
    isLoadingSubmit,
    handleSubmit,
    isFinished,
    questions,
  } = useSinglePageFormController({ formEntity });

  const { theme, toggleTheme } = useTheme();

  return (
    <FormProvider {...form}>
      <div className="min-h-screen flex flex-col items-center justify-center py-12">
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
            </header>

            <main className="flex-grow w-full">
              <form
                id="form-response"
                onSubmit={handleSubmit}
                className="w-full space-y-8"
              >
                {questions.map((question) => (
                  <div
                    key={question.id}
                    className="flex flex-col items-center text-center p-6 border rounded-lg shadow-sm"
                  >
                    <FormField question={question} />
                  </div>
                ))}

                <footer className="mt-8 flex items-center justify-end">
                  <Button type="submit" disabled={isLoadingSubmit}>
                    Enviar
                  </Button>
                </footer>
              </form>
            </main>
          </div>
        )}
      </div>
    </FormProvider>
  );
}
