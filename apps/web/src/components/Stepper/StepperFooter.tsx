import { cn } from '@/lib/utils';

interface IStepperFooterProps {
  className?: string;
  children: React.ReactNode;
}

export function StepperFooter({ children, className }: IStepperFooterProps) {
  return (
    <footer className={cn('mt-4 flex justify-end gap-2', className)}>
      {children}
    </footer>
  );
}
