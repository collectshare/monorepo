import KSUID from 'ksuid';

export class FormSubmission {
  readonly id: string;
  readonly formId: string;
  readonly submittedAt: Date;
  readonly ip: string | null;
  readonly userAgent: string | null;

  constructor(attr: FormSubmission.Attributes) {
    this.id = attr.id ?? KSUID.randomSync().string;
    this.formId = attr.formId;
    this.submittedAt = attr.submittedAt ?? new Date();
    this.ip = attr.ip ?? null;
    this.userAgent = attr.userAgent ?? null;
  }
}

export namespace FormSubmission {
  export type Attributes = {
    formId: string;
    id?: string;
    submittedAt?: Date;
    ip?: string | null;
    userAgent?: string | null;
  };
}
