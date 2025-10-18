import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import z from 'zod';

import { localStorageKeys } from '@/app/config/localStorageKeys';
import { useAuth } from '@/app/hooks/useAuth';
import { authService } from '@/app/services/authService';
import type { ISignUpParams } from '@/app/services/authService/signUp';
import { safeSessionStorageGetItem } from '@/lib/utils';

import { accountSchema } from './components/AccountStep/accountSchema';
import { profileSchema } from './components/ProfileStep/profileSchema';

const schema = z.object({
  accountStep: accountSchema,
  profileStep: profileSchema,
});

export type OnBoardingFormData = z.infer<typeof schema>;

export default function useSignUpController() {
  const { signin } = useAuth();
  const form = useForm<OnBoardingFormData>({
    resolver: zodResolver(schema),
    defaultValues: (() => {
      const onBoardingForm = safeSessionStorageGetItem<OnBoardingFormData>(
        localStorageKeys.ON_BOARDING_FORM,
      );

      if (!onBoardingForm) {
        return {
          accountStep: {
            email: '',
            password: '',
          },
          profileStep: {
            name: '',
            birthDate: undefined,
          },
        };
      }

      const { profileStep, ...rest } = onBoardingForm;

      return {
        ...rest,
        profileStep: {
          ...profileStep,
          birthDate: profileStep.birthDate
            ? new Date(profileStep.birthDate)
            : undefined,
        },
      };
    })(),
  });

  useEffect(() => {
    const { unsubscribe } = form.watch((formData) => {
      sessionStorage.setItem(localStorageKeys.ON_BOARDING_FORM, JSON.stringify(formData));
    });

    return () => {
      unsubscribe();
    };
  }, [form]);

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ['sign-up'],
    mutationFn: async (data: ISignUpParams) => authService.signUp(data),
  });

  const handleSubmit = form.handleSubmit(async data => {
    try {
      const { accessToken, refreshToken } = await mutateAsync({
        account: data.accountStep,
        profile: {
          ...data.profileStep,
          birthDate: data.profileStep.birthDate?.toISOString().split('T')[0],
        },
      });

      signin(accessToken, refreshToken);
      sessionStorage.removeItem(localStorageKeys.ON_BOARDING_FORM);
    } catch(error) {
      if (error instanceof AxiosError) {
        if (error.status === 401) {
          toast.error('Credenciais inválidas');
        }
      }
    }
  });

  return {
    form,
    isLoading: isPending,
    handleSubmit,
  };
}
