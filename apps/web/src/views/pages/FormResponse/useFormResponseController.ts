import { useFormController } from '@/app/hooks/useFormController';
import { GetByIdResponse } from '@/app/services/formsService/getForm';

interface UseFormResponseControllerProps {
  formEntity: GetByIdResponse;
}

export function useFormResponseController({
  formEntity,
}: UseFormResponseControllerProps) {
  return useFormController({ formEntity });
}
