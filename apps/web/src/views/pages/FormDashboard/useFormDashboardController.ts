
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
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

  const { mutate: handleExport, isPending: isExporting } = useMutation({
    mutationFn: () => formsService.exportSubmissions(formId!),
    onSuccess: ({ blob, filename }) => {
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    onError: () => {
      toast.error('N\u00e3o foi poss\u00edvel exportar as respostas. Tente novamente.');
    },
  });

  return {
    form: form?.form,
    questions: form?.questions,
    isLoadingForm,
    responses: responses?.submissions ?? [],
    isLoadingResponses,
    handleExport,
    isExporting,
  };
}
