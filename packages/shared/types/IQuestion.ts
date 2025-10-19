import { Question } from 'entities/Question';

export type IQuestion = InstanceType<typeof Question>;

export type IQuestionInsert = Omit<IQuestion, 'id' | 'formId' | 'order' | 'createdAt'>;
