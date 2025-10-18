import { CrossCircledIcon } from '@radix-ui/react-icons';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Controller, useFormContext } from 'react-hook-form';

import { StepperFooter } from '@/components/Stepper/StepperFooter';
import { StepperPreviousButton } from '@/components/Stepper/StepperPreviousButton';
import { Button } from '@/components/ui/Button';
import { Calendar } from '@/components/ui/Calendar';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { cn } from '@/lib/utils';

import type { OnBoardingFormData } from '../../useSignUpController';

export function ProfileStep({ isLoading }: { isLoading: boolean }) {
  const form = useFormContext<OnBoardingFormData>();

  return (
    <div>
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            {...form.register('profileStep.name')}
            error={form.formState.errors.profileStep?.name?.message}
          />
        </div>

        <div className="grid gap-2">
          <Label>Data de nascimento</Label>
          <Controller
            control={form.control}
            name="profileStep.birthDate"
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'justify-start text-left font-normal',
                      !field.value && 'text-muted-foreground',
                    )}
                    >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? (
                      format(field.value, 'dd/MM/yyyy')
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                    captionLayout="dropdown"
                  />
                </PopoverContent>
                {form.formState.errors.profileStep?.birthDate?.message && (
                  <div className="flex gap-2 items-center text-red-700">
                    <CrossCircledIcon />
                    <span className="text-xs">{form.formState.errors.profileStep?.birthDate?.message}</span>
                  </div>
                )}
              </Popover>
            )}
          />
        </div>
      </div>
      <StepperFooter>
        <StepperPreviousButton />
        <Button type="submit" isLoading={isLoading}>
          Finalizar cadastro
        </Button>
      </StepperFooter>
    </div>
  );
};
