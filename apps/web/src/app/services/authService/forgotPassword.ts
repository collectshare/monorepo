import { httpClient } from '../httpClient';

export interface IForgotPasswordParams {
  email: string;
}

export async function forgotPassword(params: IForgotPasswordParams) {
  await httpClient.post(
    '/auth/forgot-password',
    params,
  );
}
