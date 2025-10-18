import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { authService } from '@/app/services/authService';
import type { IForgotPasswordParams } from '@/app/services/authService/forgotPassword';

const schema = z.object({
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('Informe um e-mail válido')
    .trim(),
});

type FormData = z.infer<typeof schema>;

export function useForgotPasswordController() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    register,
    handleSubmit: hookFormSubmit,
    formState: { errors },
    getValues,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { mutateAsync, isPending, isSuccess } = useMutation({
    mutationKey: ['forgot-password'],
    mutationFn: async (data: IForgotPasswordParams) => authService.forgotPassword(data),
  });

  const navigateLogin = () => {
    navigate('/login', {
      state: { email: getValues('email') },
    });
  };

  const handleSubmit = hookFormSubmit(async (data) => {
    try {
      await mutateAsync(data);
      toast.success('E-mail de recuperação enviado com sucesso!');
      navigate('/forgot-password/confirm', {
        state: { email: getValues('email') },
      });
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 404) {
          toast.error('Nenhum usuário cadastrado com este e-mail.');
          return;
        }
      }
      toast.error('Erro inesperado ao enviar o e-mail de recuperação.');
    }
  });

  return {
    handleSubmit,
    register,
    errors,
    isLoading: isPending,
    isSuccess,
    prefilledEmail: location.state?.email,
    navigateLogin,
  };
}
