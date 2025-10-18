import { httpClient } from '../httpClient';

export interface ISignUpParams {
  account: {
    email: string;
    password: string;
  };
  profile: {
    name: string;
    birthDate: string;
  };
}

interface ISignUpResponse {
  accessToken: string;
  refreshToken: string;
}

export async function signUp(params: ISignUpParams) {
  const { data } = await httpClient.post<ISignUpResponse>(
    '/auth/sign-up',
    params,
  );

  return data;
}
