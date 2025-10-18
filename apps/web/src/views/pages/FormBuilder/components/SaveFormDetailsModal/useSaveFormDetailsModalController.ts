import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { IFormInsert } from '@/app/entities/IForm';
import { useModal } from '@/app/hooks/useModal';
import { formsService } from '@/app/services/formsService';
import { SaveFormRequest } from '@/app/services/formsService/save';

const schema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'O título é obrigatório').trim(),
  description: z.string().trim().optional(),
  tags: z.array(z.string()).optional(),
  isAnonymous: z.boolean().optional().default(true),
  onePage: z.boolean().optional().default(false),
});

type FormData = z.infer<typeof schema>;

interface UseSaveFormDetailsModalControllerProps {
  form?: IFormInsert
}

export function useSaveFormDetailsModalController({ form }: UseSaveFormDetailsModalControllerProps) {
  const { close } = useModal();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit: hookFormSubmit,
    formState: { errors, isSubmitting },
    control,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      id: form?.id ?? '',
      title: form?.title ?? '',
      description: form?.description ?? '',
      onePage: form?.onePage ?? false,
      tags: form?.tags ?? [],
      isAnonymous: form?.isAnonymous ?? true,
    },
  });

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ['form-save-details'],
    mutationFn: async (data: SaveFormRequest) => formsService.save(data),
  });

  const handleSubmit = hookFormSubmit(async (data) => {
    try {
      const response = await mutateAsync(data);
      toast.success(data.id ? 'Formulário atualizado com sucesso' : 'Formulário adicionado com sucesso!');
      await queryClient.invalidateQueries({ queryKey: ['form', data.id] });
      await queryClient.invalidateQueries({ queryKey: ['my-forms'] });

      if (!data.id) {
        navigate(`/forms/builder/${response.formId}`);
      }
      close();
    } catch {
      toast.error('Erro inesperado ao adicionar questões.');
    }
  });

  return {
    handleSubmit,
    register,
    control,
    isLoadingSubmit: isPending,
    errors,
    isLoading: isSubmitting,
  };
}
