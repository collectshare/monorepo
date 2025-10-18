import { IForm } from '@/app/entities/IForm';
import { IQuestion } from '@/app/entities/IQuestion';

import { httpClient } from '../httpClient';

export type GetByIdResponse = {
  form: IForm,
  questions: IQuestion[]
};

export async function getForm(id: string) {
  if (!id) {
    return null;
  }

  const { data } = await httpClient.get<GetByIdResponse>(`/forms/${id}`);

  return { form: data.form, questions: data.questions.sort((a, b) => a.order - b.order) };
}
