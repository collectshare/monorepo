import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';

import { formsService } from '@/app/services/formsService';
import { GetByIdResponse } from '@/app/services/formsService/getForm';
import { SubmitFormRequest } from '@/app/services/formsService/submit';

interface UseFormControllerProps {
  formEntity: GetByIdResponse;
}

export function useFormController({
  formEntity,
}: UseFormControllerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ['form-submit'],
    mutationFn: async (data: SubmitFormRequest) => formsService.submit(data),
  });

  const questions = formEntity?.questions ?? [];
  const totalQuestions = questions.length;

  const formSchema = z.object(
    questions.reduce(
      (acc, question) => {
        switch (question.questionType) {
          case 'TEXT':
            if (question.isRequired) {
              acc[question.id] = z.string().nonempty('Este campo é obrigatório');
            } else {
              acc[question.id] = z.string().optional().nullable();
            }
            break;

          case 'MULTIPLE_CHOICE':
          case 'DROPDOWN':
            if (question.isRequired) {
              acc[question.id] = z.string().nonempty('Selecione uma opção');
            } else {
              acc[question.id] = z.string().optional().nullable();
            }
            break;

          case 'CHECKBOX':
            if (question.isRequired) {
              acc[question.id] = z.array(z.string()).nonempty('Selecione ao menos uma opção');
            } else {
              acc[question.id] = z.array(z.string()).optional().nullable();
            }
            break;

          default:
            acc[question.id] = z.any();
        }
        return acc;

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

  const progress =
    totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  const currentQuestion = questions[currentQuestionIndex];

  const goToNextQuestion = async () => {
    const questionId = currentQuestion.id;
    const isValid = await form.trigger(questionId);

    if (isValid && currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  return {
    form,
    isLoadingSubmit: isPending,
    handleSubmit,
    currentQuestion,
    goToNextQuestion,
    goToPreviousQuestion,
    isFirstQuestion,
    isLastQuestion,
    progress,
    totalQuestions,
    currentQuestionIndex,
    isFinished,
    questions,
  };
}
