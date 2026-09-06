import { QuestionType } from '../enums/QuestionType';
import { AnonymizationSuggestion } from '../types/AnonymizationSuggestion';
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
  anonymizationSuggestion?: AnonymizationSuggestion | null;
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
    this.anonymizationSuggestion = attr.anonymizationSuggestion ?? null;
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
    anonymizationSuggestion?: AnonymizationSuggestion | null;
    id?: string;
    createdAt?: Date;
  };
}
