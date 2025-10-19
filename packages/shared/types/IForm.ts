import { Form } from "entities/Form";

export type IForm = InstanceType<typeof Form>;

export type IFormInsert = Omit<IForm, 'id' | 'accountId' | 'createdAt'> & {
  id?: string;
};
