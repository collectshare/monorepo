import { httpClient } from '../httpClient';

export type SaveFormRequest = {
  id?: string;
  title: string;
  description?: string | undefined;
  tags?: string[];
  isAnonymous: boolean;
  onePage: boolean;
}

export async function save({ id, ...params }: SaveFormRequest): Promise<{ formId?: string }> {

  const response = await httpClient.post(
    id ? `/forms/${id}` : '/forms',
    params,
  );

  return response.data;
}
