import { IFormSubmission } from './IFormSubmission';
import { IQuestion } from './IQuestion';

export interface IFormResponse {
  submission: IFormSubmission[];
  questions: IQuestion[];
}
