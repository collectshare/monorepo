import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

import { useForgotPasswordController } from './useForgotPasswordController';

export default function ForgotPassword() {
  const {
    handleSubmit,
    register,
    errors,
    isLoading,
    isSuccess,
    prefilledEmail,
    navigateLogin,
  } = useForgotPasswordController();
  return (
    <>
      <title>Recuperar senha - Collectshare</title>
      <Card className="p-4">
        <CardHeader>
          <CardTitle>Esqueceu sua senha?</CardTitle>
          <CardDescription>
            Digite seu e-mail abaixo para recuperá-la
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@exemplo.com"
                  tabIndex={1}
                  disabled={isSuccess}
                  defaultValue={prefilledEmail}
                  {...register('email')}
                  error={errors.email?.message}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
                disabled={isSuccess || isLoading}
              >
                Recuperar senha
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Lembrou sua senha?{' '}
              <Button
                type='button'
                variant="link"
                onClick={navigateLogin}
                className="p-0 h-auto text-sm font-medium underline-offset-4 hover:underline text-foreground"
              >
                Ir para login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
