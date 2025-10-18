import { useFormContext } from 'react-hook-form';

import { StepperFooter } from '@/components/Stepper/StepperFooter';
import { StepperPreviousButton } from '@/components/Stepper/StepperPreviousButton';
import { Button } from '@/components/ui/Button';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { PasswordInput } from '@/components/ui/PasswordInput';

import type { ForgotPasswordConfirmFormData } from '../../useForgotPasswordConfirmController';

export function PasswordStep({ isLoading }: { isLoading: boolean }) {
  const form = useFormContext<ForgotPasswordConfirmFormData>();

  return (
    <div className="-mt-6">
      <CardHeader>
        <CardTitle>Recuperação de senha</CardTitle>
        <CardDescription>
          Confirme sua nova senha
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="newPassword">Nova senha</Label>
          <PasswordInput
            id="newPassword"
            placeholder='•••••••'
            {...form.register('passwordStep.newPassword')}
            error={form.formState.errors.passwordStep?.newPassword?.message}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirmNewPassword">Confirmar nova senha</Label>
          <PasswordInput
            id="confirmNewPassword"
            placeholder='•••••••'
            {...form.register('passwordStep.confirmNewPassword')}
            error={form.formState.errors.passwordStep?.confirmNewPassword?.message}
          />
        </div>
        <StepperFooter className="flex-col">
          <Button type="submit" isLoading={isLoading}>
            Recuperar senha
          </Button>
          <StepperPreviousButton />
        </StepperFooter>
      </CardContent>
    </div>
  );
}
