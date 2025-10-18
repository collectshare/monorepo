import { IQuestion } from './IQuestion';

export interface IAnswer {
  id: string;
  submissionId: string;
  questionId: string;
  value: string | string[];
}

export interface ISubmission {
  id: string;
  formId: string;
  createdAt: string;
}

export interface IFormResponse {
  submission: ISubmission[];
  questions: IQuestion[];
}
