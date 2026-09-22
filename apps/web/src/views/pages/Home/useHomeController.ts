import { useQuery } from '@tanstack/react-query';

import { formsService } from '@/app/services/formsService';

const LIST_LIMIT = 5;

export function useHomeController() {
  const { isFetching: isLoadingForms, data } = useQuery({
    queryKey: ['my-forms'],
    queryFn: () => formsService.list(),
  });

  const forms = data ?? [];

  const totalForms = forms.length;
  const totalResponses = forms.reduce((sum, form) => sum + (form.submissionCount ?? 0), 0);
  const publishedCount = forms.filter((form) => form.isPublished).length;
  const draftCount = totalForms - publishedCount;

  const recentForms = [...forms]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, LIST_LIMIT);

  const topRespondedForms = [...forms]
    .filter((form) => (form.submissionCount ?? 0) > 0)
    .sort((a, b) => (b.submissionCount ?? 0) - (a.submissionCount ?? 0))
    .slice(0, LIST_LIMIT);

  const topAccessedForms = [...forms]
    .filter((form) => (form.clickCount ?? 0) > 0)
    .sort((a, b) => (b.clickCount ?? 0) - (a.clickCount ?? 0))
    .slice(0, LIST_LIMIT);

  const noResponseForms = [...forms]
    .filter((form) => form.isPublished && (form.submissionCount ?? 0) === 0)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, LIST_LIMIT);

  return {
    isLoadingForms,
    isEmpty: !isLoadingForms && totalForms === 0,
    totalForms,
    totalResponses,
    publishedCount,
    draftCount,
    recentForms,
    topRespondedForms,
    topAccessedForms,
    noResponseForms,
  };
}
