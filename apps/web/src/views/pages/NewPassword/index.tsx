import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { PasswordInput } from '@/components/ui/PasswordInput';

import { useNewPasswordController } from './useNewPasswordController';

export default function NewPassword() {
  const {
    handleSubmit,
    register,
    errors,
    isLoading,
  } = useNewPasswordController();
  return (
    <>
      <title>Nova senha - Collectshare</title>
      <Card className="p-4">
        <CardHeader>
          <CardTitle>Cadastro de nova senha</CardTitle>
          <CardDescription>
            Digite e confirme sua nova senha abaixo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="newPassword">Nova senha</Label>
                <PasswordInput
                  id="newPassword"
                  placeholder='•••••••'
                  tabIndex={1}
                  {...register('newPassword')}
                  error={errors.newPassword?.message}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmNewPassword">Confirmar nova senha</Label>
                <PasswordInput
                  id="confirmNewPassword"
                  placeholder='•••••••'
                  tabIndex={2}
                  {...register('confirmNewPassword')}
                  error={errors.confirmNewPassword?.message}
                />
              </div>
              <Button type="submit" className="w-full" isLoading={isLoading} tabIndex={3}>
                Confirmar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
