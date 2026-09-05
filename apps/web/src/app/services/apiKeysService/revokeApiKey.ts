import { httpClient } from '../httpClient';

export async function revokeApiKey(keyId: string): Promise<void> {
  await httpClient.delete(`/api-keys/${keyId}`);
}
