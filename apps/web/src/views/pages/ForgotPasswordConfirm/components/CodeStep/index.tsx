import { CrossCircledIcon } from '@radix-ui/react-icons';
import { Controller, useFormContext } from 'react-hook-form';

import { useStepper } from '@/app/hooks/useStepper';
import { StepperFooter } from '@/components/Stepper/StepperFooter';
import { StepperNextButton } from '@/components/Stepper/StepperNextButton';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/InputOTP';

import type { ForgotPasswordConfirmFormData } from '../../useForgotPasswordConfirmController';

export function CodeStep() {
  const { nextStep } = useStepper();
  const form = useFormContext<ForgotPasswordConfirmFormData>();

  async function handleNextStep() {
    const isValid = await form.trigger('codeStep', {
      shouldFocus: true,
    });

    if (isValid) {
      nextStep();
    }
  }

  return (
    <div className="-mt-6">
      <CardHeader>
        <CardTitle>Recuperação de senha</CardTitle>
        <CardDescription>
          Preencha o código recebido por e-mail
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <Controller
            control={form.control}
            name="codeStep.code"
            render={({ field }) => (
              <InputOTP
              maxLength={6}
              {...field}
              onComplete={handleNextStep}
              containerClassName="justify-center"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            )}
          />
          {form.formState.errors.codeStep?.code && (
            <div className="flex gap-2 items-center justify-center text-red-700">
              <CrossCircledIcon />
              <span className="text-xs">{form.formState.errors.codeStep.code.message}</span>
            </div>
          )}
        </div>
        <StepperFooter>
          <StepperNextButton onClick={handleNextStep} className="w-full" />
        </StepperFooter>
      </CardContent>
    </div>
  );
}
