import { IForm } from '@monorepo/shared/types/IForm';
import { IQuestion } from '@monorepo/shared/types/IQuestion';

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
