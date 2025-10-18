
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

import { IFormResponse } from '@/app/entities/IFormResponse';
import { IQuestion } from '@/app/entities/IQuestion';
import { formsService } from '@/app/services/formsService';

interface GetResponsesResponse {
  submissions: IFormResponse[];
  questions: IQuestion[];
}

export function useFormDashboardController() {
  const { formId } = useParams<{ formId: string }>();

  const { data: form, isFetching: isLoadingForm } = useQuery({
    queryKey: ['form', formId],
    queryFn: () => formsService.getForm(formId!),
    enabled: !!formId,
  });

  const { data: responsesData, isFetching: isLoadingResponses } =
    useQuery<GetResponsesResponse>({
      queryKey: ['form-responses', formId],
      queryFn: () => formsService.getResponses(formId!),
      enabled: !!formId,
    });

  return {
    form: form?.form,
    questions: responsesData?.questions,
    isLoadingForm,
    responses: responsesData?.submissions ?? [],
    isLoadingResponses,
  };
}
