import KSUID from 'ksuid';

export class Form {
  readonly id: string;
  readonly accountId: string;
  readonly createdAt: Date;
  readonly submissionCount?: number;
  title: string;
  description: string | undefined;
  tags?: string[];
  isAnonymous: boolean;
  onePage: boolean;

  constructor(attr: Form.Attributes) {
    this.id = attr.id ?? KSUID.randomSync().string;
    this.accountId = attr.accountId;
    this.title = attr.title;
    this.description = attr.description;
    this.createdAt = attr.createdAt ?? new Date();
    this.tags = attr.tags;
    this.isAnonymous = attr.isAnonymous;
    this.submissionCount = attr.submissionCount;
    this.onePage = attr.onePage;
  }
}

export namespace Form {
  export type Attributes = {
    accountId: string;
    title: string;
    description?: string;
    id?: string;
    createdAt?: Date;
    tags?: string[];
    isAnonymous: boolean;
    onePage: boolean;
    submissionCount?: number;
  };
}
