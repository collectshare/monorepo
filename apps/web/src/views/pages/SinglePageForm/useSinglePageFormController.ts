import { useFormController } from '@/app/hooks/useFormController';
import { GetByIdResponse } from '@/app/services/formsService/getForm';

interface UseSinglePageFormControllerProps {
  formEntity: GetByIdResponse;
}

export function useSinglePageFormController({
  formEntity,
}: UseSinglePageFormControllerProps) {
  return useFormController({ formEntity });
}
