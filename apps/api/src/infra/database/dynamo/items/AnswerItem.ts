import { Answer } from '@application/entities/Answer';

export class AnswerItem {
  static readonly type = 'Answer';

  private readonly keys: AnswerItem.Keys;

  constructor(private readonly attrs: AnswerItem.Attributes) {
    this.keys = {
      PK: AnswerItem.getPK(this.attrs.submissionId),
      SK: AnswerItem.getSK(this.attrs.questionId),
    };
  }

  toItem(): AnswerItem.ItemType {
    return {
      ...this.keys,
      ...this.attrs,
      type: AnswerItem.type,
    };
  }

  static fromEntity(answer: Answer) {
    return new AnswerItem({
      ...answer,
      createdAt: answer.createdAt.toISOString(),
    });
  }

  static toEntity(item: AnswerItem.ItemType) {
    return new Answer({
      id: item.id,
      submissionId: item.submissionId,
      questionId: item.questionId,
      value: item.value,
      createdAt: new Date(item.createdAt),
    });
  }

  static getPK(submissionId: string): AnswerItem.Keys['PK'] {
    return `SUBMISSION#${submissionId}`;
  }

  static getSK(questionId: string): AnswerItem.Keys['SK'] {
    return `QUESTION#${questionId}`;
  }
}

export namespace AnswerItem {
  export type Keys = {
    PK: `SUBMISSION#${string}`;
    SK: `QUESTION#${string}`;
  };

  export type Attributes = {
    id: string;
    submissionId: string;
    questionId: string;
    value: string | string[];
    createdAt: string;
  };

  export type ItemType = Keys & Attributes & {
    type: 'Answer';
  };
}
