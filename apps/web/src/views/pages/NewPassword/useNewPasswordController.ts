import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { passwordSchema } from '@/app/schemas/passwordSchema';
import { authService } from '@/app/services/authService';
import type { INewPasswordParams } from '@/app/services/authService/newPassword';

const schema = z.object({
  newPassword: passwordSchema,
  confirmNewPassword: passwordSchema,
})
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'A nova senha e sua confirmação devem ser idênticas.',
    path: ['confirmNewPassword'],
  });

type FormData = z.infer<typeof schema>;

export function useNewPasswordController() {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state.email;
  const oldPassword = location.state.oldPassword;
  if (!email || !oldPassword) {
    toast.error('Nenhum usuário selecionado.');
    navigate('/login');
  }

  const {
    register,
    handleSubmit: hookFormSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ['new-password'],
    mutationFn: async (data: INewPasswordParams) => authService.newPassword(data),
  });

  const handleSubmit = hookFormSubmit(async (data) => {
    try {
      await mutateAsync({
        email,
        oldPassword,
        newPassword: data.newPassword,
      });

      toast.success('Senha alterada com sucesso.');
      navigate('/login');
    } catch {
      toast.error('Erro inesperado.');
    }
  });

  return { handleSubmit, register, errors, isLoading: isPending };
}
