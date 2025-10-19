
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

import { formsService } from '@/app/services/formsService';

export function useFormDashboardController() {
  const { formId } = useParams<{ formId: string }>();

  const { data: form, isFetching: isLoadingForm } = useQuery({
    queryKey: ['form', formId],
    queryFn: () => formsService.getForm(formId!),
    enabled: !!formId,
  });

  const { data: responses, isFetching: isLoadingResponses } = useQuery({
    queryKey: ['form-responses', formId],
    queryFn: () => formsService.getResponses(formId!),
    enabled: !!formId,
  });

  return {
    form: form?.form,
    questions: form?.questions,
    isLoadingForm,
    responses: responses?.submissions ?? [],
    isLoadingResponses,
  };
}
