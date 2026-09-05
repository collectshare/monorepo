import { ApiKeyScope } from '@monorepo/shared/enums/ApiKeyScope';

import { httpClient } from '../httpClient';

export type ApiKeySummary = {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: ApiKeyScope[];
  createdAt: string;
};

export async function listApiKeys(): Promise<ApiKeySummary[]> {
  const { data } = await httpClient.get<{ apiKeys: ApiKeySummary[] }>('/api-keys');

  return data.apiKeys;
}
