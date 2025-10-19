import { Question, QuestionType } from '@monorepo/shared/entities/Question';

export class QuestionItem {
  static readonly type = 'Question';

  private readonly keys: QuestionItem.Keys;

  constructor(private readonly attrs: QuestionItem.Attributes) {
    this.keys = {
      PK: QuestionItem.getPK(this.attrs.formId),
      SK: QuestionItem.getSK(this.attrs.id),
    };
  }

  toItem(): QuestionItem.ItemType {
    return {
      ...this.keys,
      ...this.attrs,
      type: QuestionItem.type,
    };
  }

  static fromEntity(question: Question) {
    return new QuestionItem({
      ...question,
      createdAt: question.createdAt.toISOString(),
    });
  }

  static toEntity(questionItem: QuestionItem.ItemType) {
    return new Question({
      id: questionItem.id,
      formId: questionItem.formId,
      text: questionItem.text,
      questionType: questionItem.questionType,
      options: questionItem.options,
      order: questionItem.order,
      createdAt: new Date(questionItem.createdAt),
    });
  }

  static getPK(formId: string): QuestionItem.Keys['PK'] {
    return `FORM#${formId}`;
  }

  static getSK(questionId: string): QuestionItem.Keys['SK'] {
    return `QUESTION#${questionId}`;
  }
}

export namespace QuestionItem {
  export type Keys = {
    PK: `FORM#${string}`;
    SK: `QUESTION#${string}`;
  };

  export type Attributes = {
    id: string;
    formId: string;
    text: string;
    questionType: QuestionType;
    options: string[] | undefined;
    order: number;
    createdAt: string;
  };

  export type ItemType = Keys & Attributes & {
    type: 'Question';
  };
}
