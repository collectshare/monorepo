import { useStepper } from '@/app/hooks/useStepper';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

type IStepperPreviousButtonProps = React.ComponentPropsWithoutRef<typeof Button> & {
  className?: string;
  text?: string;
}

export function StepperPreviousButton({
  text,
  className,
  size = 'default',
  variant = 'outline',
  type = 'button',
  onClick,
  ...props
}: IStepperPreviousButtonProps) {
  const { previousStep } = useStepper();

  return (
    <Button
      size={size}
      variant={variant}
      className={cn(className)}
      type={type}
      onClick={onClick ?? previousStep}
      {...props}
    >
      {text ?? 'Anterior'}
    </Button>
  );
}
