import { zodResolver } from '@hookform/resolvers/zod';
import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';

import { formsService } from '@/app/services/formsService';
import { GetByIdResponse } from '@/app/services/formsService/getForm';
import { SubmitFormRequest } from '@/app/services/formsService/submit';
import { toBase64 } from '@/app/utils/toBase64';

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
          case QuestionType.TEXT:
            if (question.isRequired) {
              acc[question.id] = z.string().nonempty('Este campo é obrigatório');
            } else {
              acc[question.id] = z.string().optional().nullable();
            }
            break;

          case QuestionType.MULTIPLE_CHOICE:
          case QuestionType.DROPDOWN:
            if (question.isRequired) {
              acc[question.id] = z.string().nonempty('Selecione uma opção');
            } else {
              acc[question.id] = z.string().optional().nullable();
            }
            break;

          case QuestionType.CHECKBOX:
            if (question.isRequired) {
              acc[question.id] = z.array(z.string()).nonempty('Selecione ao menos uma opção');
            } else {
              acc[question.id] = z.array(z.string()).optional().nullable();
            }
            break;

          case QuestionType.STARS:
            if (question.isRequired) {
              acc[question.id] = z.number().min(1, 'Este campo é obrigatório');
            } else {
              acc[question.id] = z.number().optional().nullable();
            }
            break;

          case QuestionType.FILE:
            if (question.isRequired) {
              acc[question.id] = z.instanceof(File, { message: 'Este campo é obrigatório' });
            } else {
              acc[question.id] = z.instanceof(File).optional().nullable();
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
      const answers = await Promise.all(Object.entries(formData).map(async ([questionId, value]) => {
        const question = questions.find(q => q.id === questionId);
        if (question?.questionType === QuestionType.FILE && value instanceof File) {
          const content = await toBase64(value);
          return {
            questionId,
            value: {
              name: value.name,
              type: value.type,
              content,
            },
          };
        }

        return {
          questionId,
          value: value as string | string[],
        };
      }));

      await mutateAsync({
        id: formEntity.form.id,
        answers: answers.filter(a => a.value !== null && a.value !== undefined),
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
