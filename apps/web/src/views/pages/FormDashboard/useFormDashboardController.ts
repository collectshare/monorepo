
import { IFormSubmission } from '@monorepo/shared/types/IFormSubmission';
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

  const handleExport = () => {
    if (!form?.questions || !responses || responses?.submissions.length === 0) {
      return;
    }

    const escapeCsvCell = (cell: string | number | null | undefined) => {
      if (cell === null || cell === undefined) { return ''; }
      const str = String(cell);
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const header = form.questions.map((q) => escapeCsvCell(q.text));

    const rows = (responses?.submissions as IFormSubmission[]).map((response) =>
      form.questions
        .map((question) => {
          const answer = response.answers.find(
            (a) => a.questionId === question.id,
          );

          if (!answer) { return ''; }

          const value = Array.isArray(answer.value)
            ? answer.value.join(', ')
            : answer.value;

          return escapeCsvCell(value);
        })
        .join(';'),
    );

    const csvContent = [header.join(';'), ...rows].join('\n');

    const blob = new Blob([`\ufeff${csvContent}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `${form?.form?.title?.replace(/ /g, '_') ?? 'export'}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    form: form?.form,
    questions: form?.questions,
    isLoadingForm,
    responses: responses?.submissions ?? [],
    isLoadingResponses,
    handleExport,
  };
}
