import { FormProvider } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { StepperProvider } from '@/app/contexts/StepperContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

import { AccountStep } from './components/AccountStep';
import { ProfileStep } from './components/ProfileStep';
import useSignUpController from './useSignUpController';

export default function SignUp() {
  const {
    isLoading,
    form,
    handleSubmit,
  } = useSignUpController();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crie sua conta</CardTitle>
        <CardDescription>
          Preencha os campos abaixo para criar sua conta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormProvider {...form}>
          <form onSubmit={handleSubmit}>
            <StepperProvider
              steps={[
                {
                  label: 'Conta',
                  content: <AccountStep />,
                },
                {
                  label: 'Dados pessoais',
                  content: <ProfileStep isLoading={isLoading} />,
                },
              ]}
            />
          </form>
        </FormProvider>
        <div className="mt-4 text-center text-sm">
          Já possui uma conta?{' '}
          <Button
            type='button'
            variant="link"
            className="p-0 h-auto text-sm underline-offset-4 hover:underline text-foreground"
          >
            <Link to="/sign-in">
              Ir para login
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
