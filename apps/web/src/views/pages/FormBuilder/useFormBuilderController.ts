import { zodResolver } from '@hookform/resolvers/zod';
import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import { IQuestionInsert } from '@monorepo/shared/types/IQuestion';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import z from 'zod';

import { formsService } from '@/app/services/formsService';
import { InsertQuestionsRequest } from '@/app/services/formsService/insertQuestions';

import { fieldSchema } from './components/schema';

export const formBuilderFormData = z.object({
  id: z.string().optional(),
  title: z.string({ required_error: 'O título é obrigatório' }).min(1, 'O título é obrigatório').trim(),
  description: z.string().trim().optional(),
  fields: z.array(fieldSchema),
});

export type FormBuilderFormData = z.infer<typeof formBuilderFormData>;

export function useFormBuilderController() {
  const params = useParams();
  const navigate = useNavigate();
  const [draggingIndex, setDraggingIndex] = useState<null | number>(null);

  const form = useForm<FormBuilderFormData>({
    resolver: zodResolver(formBuilderFormData),
  });

  const { data: formToEdit, isFetching: isLoadingForm } = useQuery({
    queryKey: ['form', params.id],
    queryFn: () => formsService.getForm(params.id!),
    enabled: !!params.id,
  });

  useEffect(() => {
    if (formToEdit) {
      const fields = formToEdit?.questions.map(question => ({
        text: question.text,
        questionType: question.questionType,
        options: question.options,
        isRequired: question.isRequired,
      })).map(field => ({
        ...field,
        options: field.options || [],
      })) || [];

      form.setValue('id', formToEdit.form.id);
      form.setValue('title', formToEdit.form.title);
      form.setValue('description', formToEdit.form.description);
      form.setValue('fields', fields);
    }
  }, [formToEdit]);

  const fields = useFieldArray({
    control: form.control,
    name: 'fields',
  });

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ['form-save-questions'],
    mutationFn: async (data: InsertQuestionsRequest) => formsService.insertQuestions(data),
  });

  const handleSubmit = form.handleSubmit(async formData => {
    try {
      await mutateAsync({
        id: formData.id!,
        questions: formData.fields.map((field, index) => ({
          ...field,
          order: index + 1,
        })),
      });
      toast.success('Questões adicionadas com sucesso!');
      navigate('/my-forms');
    } catch {
      toast.error('Erro inesperado ao adicionar questões.');
    }
  });

  function handleDragStart(index: number) {
    setDraggingIndex(index);
  }

  function handleDragEnd() {
    setDraggingIndex(null);
  }

  function handleReorder(newOrder: typeof fields.fields) {
    if (draggingIndex === null) {
      return;
    }

    const draggingField = fields.fields[draggingIndex];

    newOrder.forEach((field, index) => {
      if (field === draggingField) {
        fields.move(draggingIndex, index);
        setDraggingIndex(index);
      }
    });
  }

  function addField(questionType: QuestionType) {
    if (questionType === QuestionType.TEXT) {
      fields.append({ text: 'Novo campo', questionType, isRequired: false });
    } else {
      fields.append({ text: 'Novo campo', questionType, options: [], isRequired: false });
    }
  }

  function cloneField(field: IQuestionInsert) {
    fields.append({
      text: field.text,
      questionType: field.questionType,
      options: field.options || [],
      isRequired: field.isRequired,
    });
  }

  return {
    form,
    formEntity: formToEdit?.form,
    fields,
    draggingIndex,
    isLoading: isPending,
    isLoadingForm,
    handleSubmit,
    handleDragStart,
    handleDragEnd,
    handleReorder,
    addField,
    cloneField,
  };
}
