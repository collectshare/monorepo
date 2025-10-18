import { z } from 'zod';

import { isValidCnpj, isValidCpf } from '../utils/documentValidators';

export const documentSchema = z
  .string()
  .min(1, 'Documento é obrigatório')
  .refine(
    (doc) => {
      const cleanedDoc = doc.replace(/\D/g, '');

      if (cleanedDoc.length === 11) {
        return isValidCpf(cleanedDoc);
      }
      if (cleanedDoc.length === 14) {
        return isValidCnpj(cleanedDoc);
      }
      return false;
    },
    {
      message: 'Documento inválido.',
    },
  );
