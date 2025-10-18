import { httpClient } from '../httpClient';

export interface INewPasswordParams {
  email: string;
  oldPassword: string;
  newPassword: string;
}

export async function newPassword(params: INewPasswordParams) {
  const { data } = await httpClient.post(
    '/auth/new-password',
    params,
  );

  return data;
}
