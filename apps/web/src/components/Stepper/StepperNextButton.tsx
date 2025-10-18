import { useStepper } from '@/app/hooks/useStepper';
import { cn } from '@/lib/utils';

import { Button } from '../ui/Button';

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
