import { useQuery } from '@tanstack/react-query';

import { formsService } from '@/app/services/formsService';

export function useMyFormsController() {

  const { isFetching: isLoadingForms, data: forms } = useQuery({
    queryKey: ['my-forms'],
    queryFn: () => formsService.list(),
  });

  return {
    isLoadingForms,
    forms: forms ?? [],
  };
}
