import { cn } from '../lib/utils';

// Inline (not <img>) so the dark stroke follows the theme via currentColor.
export function LogoSymbol({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className={cn('size-6 shrink-0', className)}>
      <g strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M26 12H12a6 6 0 0 0-6 6v18a6 6 0 0 0 6 6h18a6 6 0 0 0 6-6V26" stroke="currentColor" />
        <path d="M13 27l7 7L42 8M32 7h10v10" stroke="#f59e0b" />
      </g>
    </svg>
  );
}

export function Logo({ className, textClassName }: { className?: string; textClassName?: string }) {
  return (
    <span className={cn('flex items-center gap-2 text-foreground', className)}>
      <LogoSymbol />
      <span className={cn('font-bold text-lg tracking-tight', textClassName)}>collectshare</span>
    </span>
  );
}
