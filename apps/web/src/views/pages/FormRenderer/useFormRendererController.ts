import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

import { formsService } from '@/app/services/formsService';

export function useFormRendererController() {
  const params = useParams();

  const { data: formToResponse, isFetching: isLoadingForm } = useQuery({
    queryKey: ['form-response', params.id],
    queryFn: () => formsService.getForm(params.id!),
    enabled: !!params.id,
  });

  return {
    formEntity: formToResponse,
    isLoading: isLoadingForm,
  };
}
