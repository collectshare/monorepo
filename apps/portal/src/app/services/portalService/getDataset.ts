import { Form } from '@monorepo/shared/entities/Form';
import { Question } from '@monorepo/shared/entities/Question';

import { httpClient } from '../httpClient';

export type GetDatasetResponse = {
  form: Form;
  questions: Question[];
};

export async function getDataset(formId: string): Promise<GetDatasetResponse> {
  const { data } = await httpClient.get<GetDatasetResponse>(`/portal/datasets/${formId}`);

  return data;
}
