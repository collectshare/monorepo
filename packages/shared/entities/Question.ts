import { QuestionType } from '../enums/QuestionType';
import KSUID from 'ksuid';

export class Question {
  readonly id: string;
  readonly formId: string;
  text: string;
  questionType: QuestionType;
  options: string[] | undefined;
  order: number;
  isRequired?: boolean;
  max?: number;
  readonly createdAt: Date;

  constructor(attr: Question.Attributes) {
    this.id = attr.id ?? KSUID.randomSync().string;
    this.formId = attr.formId;
    this.text = attr.text;
    this.questionType = attr.questionType;
    this.options = attr.options;
    this.order = attr.order;
    this.isRequired = attr.isRequired ?? false;
    this.max = attr.max;
    this.createdAt = attr.createdAt ?? new Date();
  }
}

export namespace Question {
  export type Attributes = {
    formId: string;
    text: string;
    questionType: QuestionType;
    order: number;
    options?: string[];
    isRequired?: boolean;
    max?: number;
    id?: string;
    createdAt?: Date;
  };
}
