import KSUID from 'ksuid';

export enum QuestionType {
  TEXT = 'TEXT',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  CHECKBOX = 'CHECKBOX',
  DROPDOWN = 'DROPDOWN',
}

export class Question {
  readonly id: string;
  readonly formId: string;
  text: string;
  questionType: QuestionType;
  options: string[] | undefined;
  order: number;
  readonly createdAt: Date;

  constructor(attr: Question.Attributes) {
    this.id = attr.id ?? KSUID.randomSync().string;
    this.formId = attr.formId;
    this.text = attr.text;
    this.questionType = attr.questionType;
    this.options = attr.options;
    this.order = attr.order;
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
    id?: string;
    createdAt?: Date;
  };
}
