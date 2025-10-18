import { httpClient } from '../httpClient';

export interface ISignInParams {
  email: string;
  password: string;
}

interface ISignInResponse {
  accessToken: string;
  refreshToken: string;
}

export async function signIn(params: ISignInParams) {
  const { data } = await httpClient.post<ISignInResponse>(
    '/auth/sign-in',
    params,
  );

  return data;
}
