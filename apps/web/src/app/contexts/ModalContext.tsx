import React, { createContext, useState } from 'react';

import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { cn } from '@/lib/utils';

export interface IModalContextValue {
  isOpen: boolean;
  open(content: React.ReactNode, className?: string): void;
  close(): void;
}

export const ModalContext = createContext<IModalContextValue>(
  {} as IModalContextValue,
);

interface IModalProviderProps {
  children: React.ReactNode;
}

export default function ModalProvider({ children }: IModalProviderProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [className, setClassName] = useState<string>('');
  const [content, setContent] = useState<React.ReactNode | null>(null);

  function open(content: React.ReactNode, className?: string) {
    setIsOpen(true);
    setContent(content);
    setClassName(className ?? '');
  }

  function close() {
    setIsOpen(false);
  }

  return (
    <ModalContext.Provider
      value={{
        isOpen,
        open,
        close,
      }}
    >
      {children}
      {
        <Dialog open={isOpen}>
          <DialogContent className={cn('sm:max-w-[425px]', className)}>
            {content}
          </DialogContent>
        </Dialog>
      }
    </ModalContext.Provider>
  );
}
