import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { useAuth } from '@/app/hooks/useAuth';
import { passwordSchema } from '@/app/schemas/passwordSchema';
import { authService } from '@/app/services/authService';
import type { ISignInParams } from '@/app/services/authService/signin';

const schema = z.object({
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('Informe um e-mail válido')
    .trim(),
  password: passwordSchema,
});

type FormData = z.infer<typeof schema>;

export function useSignInController() {
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

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ['sign-in'],
    mutationFn: async (data: ISignInParams) => authService.signIn(data),
  });

  const { signin } = useAuth();

  const navigateForgotPassword = () => {
    navigate('/forgot-password', {
      state: { email: getValues('email') },
    });
  };

  const handleSubmit = hookFormSubmit(async (data) => {
    try {
      const { accessToken, refreshToken } = await mutateAsync(data);
      signin(accessToken, refreshToken);
    } catch(error) {
      if (error instanceof AxiosError) {
        if (error.status === 401) {
          toast.error('Credenciais inválidas');
        }
      }
    }
  });

  return {
    handleSubmit,
    register,
    errors,
    isLoading: isPending,
    prefilledEmail: location.state?.email,
    navigateForgotPassword,
  };
}
