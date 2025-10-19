
import { IFormResponse } from '@monorepo/shared/types/IFormResponse';

import { httpClient } from '../httpClient';

export async function getResponses(formId: string): Promise<IFormResponse[]> {
  if (!formId) {
    return [];
  }

  const { data } = await httpClient.get<IFormResponse[]>(`/forms/${formId}/submissions`);

  return data;
}
