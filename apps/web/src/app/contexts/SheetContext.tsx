import React, { createContext, useState } from 'react';

import { Sheet, SheetContent } from '@/components/ui/Sheet';

export interface ISheetContextValue {
  isOpen: boolean;
  open(content: React.ReactNode): void;
  close(): void;
}

export const SheetContext = createContext<ISheetContextValue>(
  {} as ISheetContextValue,
);

interface ISheetProviderProps {
  children: React.ReactNode;
}

export default function SheetProvider({ children }: ISheetProviderProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [content, setContent] = useState<React.ReactNode | null>(null);

  function open(content: React.ReactNode) {
    setIsOpen(true);
    setContent(content);
  }

  function close() {
    setIsOpen(false);
  }

  return (
    <SheetContext.Provider
      value={{
        isOpen,
        open,
        close,
      }}
    >
      {children}
      {<Sheet open={isOpen}>
        <SheetContent onClickClose={close}>
          {content}
        </SheetContent>
      </Sheet>}
    </SheetContext.Provider>
  );
}
