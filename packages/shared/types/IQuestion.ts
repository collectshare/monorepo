import { Question } from '../entities/Question';

export type IQuestion = Omit<InstanceType<typeof Question>, 'createdAt'> & {
  createdAt: string;
};

export type IQuestionInsert = Omit<IQuestion, 'id' | 'formId' | 'order' | 'createdAt'>;
