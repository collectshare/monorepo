import { FormProvider } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { StepperProvider } from '@/app/contexts/StepperContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

import { CodeStep } from './components/CodeStep';
import { PasswordStep } from './components/PasswordStep';
import { useForgotPasswordConfirmController } from './useForgotPasswordConfirmController';

export default function ForgotPasswordConfirm() {
  const {
    form,
    handleSubmit,
    isLoading,
  } = useForgotPasswordConfirmController();
  return (
    <>
      <title>Nova senha - Collectshare</title>
      <Card className="p-4">
        <FormProvider {...form}>
          <form onSubmit={handleSubmit}>
            <StepperProvider
              showSteps={false}
              steps={[
                {
                  label: 'Código',
                  content: <CodeStep />,
                },
                {
                  label: 'Nova senha',
                  content: <PasswordStep isLoading={isLoading} />,
                },
              ]}
            />
          </form>
        </FormProvider>
        <div className="mt-2 text-center text-sm">
          Lembrou da sua senha?{' '}
          <Button
            type='button'
            variant="link"
            className="p-0 h-auto text-sm underline-offset-4 hover:underline text-foreground"
          >
            <Link to="/sign-in">
              Fazer login
            </Link>
          </Button>
        </div>
      </Card>
    </>
  );
}
