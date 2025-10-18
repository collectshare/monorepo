import { useContext } from 'react';

import { ModalContext } from '../contexts/ModalContext';

export function useModal() {
  return useContext(ModalContext);
}
