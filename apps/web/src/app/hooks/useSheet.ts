import { useContext } from 'react';

import { SheetContext } from '../contexts/SheetContext';

export function useSheet() {
  return useContext(SheetContext);
}
