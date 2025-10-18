import { httpClient } from '../httpClient';

export type SubmitFormRequest = {
  id: string;
  answers: {
    questionId: string;
    value: string | string[];
  }[]
}

export async function submit({ id, ...params }: SubmitFormRequest): Promise<{ formId?: string }> {

  const response = await httpClient.post(
    `/forms/${id}/submissions`,
    params,
  );

  return response.data;
}
