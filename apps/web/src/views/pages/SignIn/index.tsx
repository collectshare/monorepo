
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@monorepo/ui';
import { Link } from 'react-router-dom';

import { Label } from '@/components/ui/Label';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';

import { useSignInController } from './useSignInController';

export default function SignIn() {
  const {
    handleSubmit,
    register,
    errors,
    isLoading,
    navigateForgotPassword,
    prefilledEmail,
  } = useSignInController();
  return (

    <div className={cn('flex flex-col gap-6')}>
      <Card>
        <CardHeader>
          <CardTitle>Entre em sua conta</CardTitle>
          <CardDescription>
            Digite seu e-mail abaixo para acessar sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-4">
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@exemplo.com"
                  tabIndex={1}
                  defaultValue={prefilledEmail}
                  {...register('email')}
                  error={errors.email?.message}
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Senha</Label>
                  <Button
                    type='button'
                    variant="link"
                    onClick={navigateForgotPassword}
                    className="ml-auto text-sm underline-offset-4 hover:underline text-foreground p-0"
                    tabIndex={4}
                  >
                    Esqueci minha senha
                  </Button>
                </div>
                <PasswordInput
                  id="password"
                  className="mb-2"
                  placeholder='•••••••'
                  tabIndex={2}
                  {...register('password')}
                  error={errors.password?.message}
                />
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full"
                  isLoading={isLoading}
                  tabIndex={3}
                >
                  Entrar
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" className="w-full" disabled>
                        Entrar com Univali
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <span>🚧 Integração em construção</span>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Não possui uma conta?{' '}
              <Link to="/sign-up" className="ml-auto text-sm font-medium underline-offset-4 hover:underline text-foreground p-0">
                Cadastre-se
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
