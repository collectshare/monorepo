import { ApiKeyScope } from '@monorepo/shared/enums/ApiKeyScope';

import { httpClient } from '../httpClient';

export type CreateApiKeyRequest = {
  name: string;
  scopes?: ApiKeyScope[];
};

export type CreateApiKeyResponse = {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: ApiKeyScope[];
  createdAt: string;
  key: string;
};

export async function createApiKey(params: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
  const { data } = await httpClient.post<CreateApiKeyResponse>('/api-keys', params);

  return data;
}
