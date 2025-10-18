import React from 'react';

interface PageLayoutProps {
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  children: React.ReactNode;
}

export default function PageLayout({ title, subtitle, children }: PageLayoutProps) {
  return (
    <div className="h-full flex-1 flex-col space-y-4 md:flex">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {subtitle && (
          <span className="text-muted-foreground text-sm">
            {subtitle}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
