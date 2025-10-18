import KSUID from 'ksuid';

export class Answer {
  readonly id: string;
  readonly submissionId: string;
  readonly questionId: string;
  value: string | string[];
  readonly createdAt: Date;

  constructor(attr: Answer.Attributes) {
    this.id = attr.id ?? KSUID.randomSync().string;
    this.submissionId = attr.submissionId;
    this.questionId = attr.questionId;
    this.value = attr.value;
    this.createdAt = attr.createdAt ?? new Date();
  }
}

export namespace Answer {
  export type Attributes = {
    submissionId: string;
    questionId: string;
    value: string | string[];
    id?: string;
    createdAt?: Date;
  };
}
