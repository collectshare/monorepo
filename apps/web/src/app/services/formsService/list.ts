import { id } from 'date-fns/locale';

import { IForm } from '@/app/entities/IForm';

import { httpClient } from '../httpClient';

export type ListResponse = {
  forms: IForm[],
};

export async function list() {
  if (!id) {
    return null;
  }

  const { data } = await httpClient.get<ListResponse>('/forms');

  return data.forms;
}
