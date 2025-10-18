import { CrossCircledIcon } from '@radix-ui/react-icons';
import * as React from 'react';

import { cn } from '@/lib/utils';

export interface IInputProps
  extends React.ComponentProps<'input'> {
    asChild?: boolean
    error?: string
}

const Input = React.forwardRef<HTMLInputElement, IInputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <>
        <input
          type={type}
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-transparent px-4 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            className,
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <div className="flex gap-2 items-center text-red-700">
            <CrossCircledIcon />
            <span className="text-xs">{error}</span>
          </div>
        )}
      </>
    );
  },
);
Input.displayName = 'Input';

export { Input };
