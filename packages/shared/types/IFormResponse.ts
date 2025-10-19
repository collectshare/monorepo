import { IFormSubmission } from './IFormSubmission';
import { IQuestion } from './IQuestion';

export interface IFormResponse {
  submissions: IFormSubmission[];
  questions: IQuestion[];
}
