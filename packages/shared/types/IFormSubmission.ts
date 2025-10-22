import { FormSubmission } from '../entities/FormSubmission';

export type IFormSubmission = InstanceType<typeof FormSubmission> & {
  answers: Array<{
    questionId: string;
    value: string | string[];
  }>;
};