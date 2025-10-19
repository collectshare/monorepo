import { Form } from '../entities/Form';

export type IForm = Omit<InstanceType<typeof Form>, 'createdAt'> & {
  createdAt: string;
};

export type IFormInsert = Omit<IForm, 'id' | 'accountId' | 'createdAt'> & {
  id?: string;
};
