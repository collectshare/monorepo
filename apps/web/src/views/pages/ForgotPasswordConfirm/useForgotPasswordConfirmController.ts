import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { authService } from '@/app/services/authService';
import type { IForgotPasswordConfirmParams } from '@/app/services/authService/forgotPasswordConfirm';

import { codeSchema } from './components/CodeStep/codeSchema';
import { passwordSchema } from './components/PasswordStep/passwordSchema';

const forgotPasswordConfirmSchema = z.object({
  codeStep: codeSchema,
  passwordStep: passwordSchema,
});

export type ForgotPasswordConfirmFormData = z.infer<typeof forgotPasswordConfirmSchema>;

export function useForgotPasswordConfirmController() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      toast.error('E-mail não informado.');
      navigate('/');
    }
  }, [email, navigate]);

  const form = useForm<ForgotPasswordConfirmFormData>({
    resolver: zodResolver(forgotPasswordConfirmSchema),
  });

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ['forgot-password-confirm'],
    mutationFn: async (data: IForgotPasswordConfirmParams) => authService.forgotPasswordConfirm(data),
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await mutateAsync({
        confirmationCode: data.codeStep.code,
        email: email as string,
        password: data.passwordStep.newPassword,
      });

      toast.success('Nova senha cadastrada com sucesso.');
      navigate('/sign-in');
    } catch {
      toast.error('Código inválido ou expirado.');
    }
  });

  return { form, handleSubmit, isLoading: isPending };
}
