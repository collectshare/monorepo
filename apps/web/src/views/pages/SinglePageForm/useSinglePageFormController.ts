import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';

import { formsService } from '@/app/services/formsService';
import { GetByIdResponse } from '@/app/services/formsService/getForm';
import { SubmitFormRequest } from '@/app/services/formsService/submit';

interface UseSinglePageFormControllerProps {
  formEntity: GetByIdResponse;
}

export function useSinglePageFormController({
  formEntity,
}: UseSinglePageFormControllerProps) {
  const [isFinished, setIsFinished] = useState(false);

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ['form-submit'],
    mutationFn: async (data: SubmitFormRequest) => formsService.submit(data),
  });

  const questions = formEntity?.questions ?? [];

  const formSchema = z.object(
    questions.reduce(
      (acc, question) => {
        let schema;

        switch (question.questionType) {
          case 'TEXT':
            schema = z.string().min(1, 'Este campo é obrigatório');
            break;
          case 'MULTIPLE_CHOICE':
            schema = z.string().min(1, 'Selecione uma opção');
            break;
          case 'CHECKBOX':
            schema = z.array(z.string()).min(1, 'Selecione ao menos uma opção');
            break;
          case 'DROPDOWN':
            schema = z.string().min(1, 'Selecione uma opção');
            break;
          default:
            schema = z.any();
        }

        return {
          ...acc,
          [question.id]: schema,
        };
      },
      {} as Record<string, z.ZodTypeAny>,
    ) ?? {},
  );

  type FormResponseData = z.infer<typeof formSchema>;

  const form = useForm<FormResponseData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  });

  const handleSubmit = form.handleSubmit(async (formData) => {
    try {
      await mutateAsync({
        id: formEntity.form.id,
        answers: Object.entries(formData).map(([questionId, value]) => ({
          questionId,
          value: value as string | string[],
        })),
      });
      toast.success('Formulário enviado com sucesso!');
      setIsFinished(true);
    } catch {
      toast.error('Erro inesperado ao enviar o formulário.');
    }
  });

  return {
    form,
    isLoadingSubmit: isPending,
    handleSubmit,
    isFinished,
    questions,
  };
}
