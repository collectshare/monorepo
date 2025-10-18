import { type IUserProfile } from '../../entities/IUserProfile';
import { httpClient } from '../httpClient';

type MeResponse = IUserProfile;

export async function me() {
  const { data } = await httpClient.get<MeResponse>('/me');

  return data;
}
