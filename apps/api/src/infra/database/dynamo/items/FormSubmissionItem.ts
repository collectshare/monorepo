import { FormSubmission } from '@monorepo/shared/entities/FormSubmission';

export class FormSubmissionItem {
  static readonly type = 'FormSubmission';

  private readonly keys: FormSubmissionItem.Keys;

  constructor(private readonly attrs: FormSubmissionItem.Attributes) {
    this.keys = {
      PK: FormSubmissionItem.getPK(this.attrs.formId),
      SK: FormSubmissionItem.getSK(this.attrs.id),
    };
  }

  toItem(): FormSubmissionItem.ItemType {
    return {
      ...this.keys,
      ...this.attrs,
      type: FormSubmissionItem.type,
    };
  }

  static fromEntity(submission: FormSubmission) {
    return new FormSubmissionItem({
      id: submission.id,
      formId: submission.formId,
      submittedAt: submission.submittedAt.toISOString(),
      ip: submission.ip,
      userAgent: submission.userAgent,
    });
  }

  static toEntity(item: FormSubmissionItem.ItemType) {
    return new FormSubmission({
      id: item.id,
      formId: item.formId,
      submittedAt: new Date(item.submittedAt),
      ip: item.ip,
      userAgent: item.userAgent,
    });
  }

  static getPK(formId: string): FormSubmissionItem.Keys['PK'] {
    return `FORM#${formId}`;
  }

  static getSK(submissionId: string): FormSubmissionItem.Keys['SK'] {
    return `SUBMISSION#${submissionId}`;
  }
}

export namespace FormSubmissionItem {
  export type Keys = {
    PK: `FORM#${string}`;
    SK: `SUBMISSION#${string}`;
  };

  export type Attributes = {
    id: string;
    formId: string;
    submittedAt: string;
    ip: string | null;
    userAgent: string | null;
  };

  export type ItemType = Keys & Attributes & {
    type: 'FormSubmission';
  };
}
