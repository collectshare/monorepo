import { useFormContext } from 'react-hook-form';

import { useStepper } from '@/app/hooks/useStepper';
import { StepperFooter } from '@/components/Stepper/StepperFooter';
import { StepperNextButton } from '@/components/Stepper/StepperNextButton';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { PasswordInput } from '@/components/ui/PasswordInput';

import type { OnBoardingFormData } from '../../useSignUpController';

export function AccountStep() {
  const { nextStep } = useStepper();
  const form = useFormContext<OnBoardingFormData>();

  async function handleNextStep() {
    const isValid = await form.trigger('accountStep', {
      shouldFocus: true,
    });

    if (isValid) {
      nextStep();
    }
  }

  return (
    <div>
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            {...form.register('accountStep.email')}
            error={form.formState.errors.accountStep?.email?.message}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Senha</Label>
          <PasswordInput
            id="password"
            {...form.register('accountStep.password')}
            error={form.formState.errors.accountStep?.password?.message}
          />
        </div>
      </div>

      <StepperFooter>
        <StepperNextButton onClick={handleNextStep} />
      </StepperFooter>
    </div>
  );
}
