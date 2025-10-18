import { httpClient } from '../httpClient';

export interface IForgotPasswordConfirmParams {
  email: string;
  confirmationCode: string;
  password: string;
}

export async function forgotPasswordConfirm(params: IForgotPasswordConfirmParams) {
  const { data } = await httpClient.post(
    '/auth/forgot-password/confirm',
    params,
  );

  return data;
}
