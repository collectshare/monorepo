import { Button } from '@monorepo/ui';

import { useStepper } from '@/app/hooks/useStepper';
import { cn } from '@/lib/utils';

type IStepperNextButtonProps = React.ComponentPropsWithoutRef<typeof Button> & {
  className?: string;
  text?: string;
}

export function StepperNextButton({
  text,
  className,
  size = 'default',
  type = 'button',
  onClick,
  ...props
}: IStepperNextButtonProps) {
  const { nextStep } = useStepper();

  return (
    <Button
      className={cn(className)}
      size={size}
      type={type}
      onClick={onClick ?? nextStep}
      {...props}
    >
      {text ?? 'Próximo'}
    </Button>
  );
}
