import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';

import { apiKeysService } from '@/app/services/apiKeysService';

const schema = z.object({
  name: z.string().min(1, 'O nome é obrigatório'),
});

type FormData = z.infer<typeof schema>;

export function useApiKeysController() {
  const queryClient = useQueryClient();
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: apiKeysService.listApiKeys,
  });

  const { register, handleSubmit: hookFormSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { mutateAsync: create, isPending: isCreating } = useMutation({
    mutationFn: (data: FormData) => apiKeysService.createApiKey({ name: data.name }),
    onSuccess: async (response) => {
      setCreatedKey(response.key);
      reset();
      await queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API Key criada com sucesso!');
    },
    onError: () => toast.error('Erro ao criar API Key.'),
  });

  const { mutateAsync: revoke, isPending: isRevoking } = useMutation({
    mutationFn: (keyId: string) => apiKeysService.revokeApiKey(keyId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API Key revogada.');
    },
    onError: () => toast.error('Erro ao revogar API Key.'),
  });

  const handleSubmit = hookFormSubmit(async (data) => {
    await create(data);
  });

  return {
    apiKeys,
    isLoading,
    createdKey,
    setCreatedKey,
    register,
    handleSubmit,
    errors,
    isCreating,
    revoke,
    isRevoking,
  };
}
