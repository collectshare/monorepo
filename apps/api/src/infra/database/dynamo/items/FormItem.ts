import { Form } from '@application/entities/Form';

export class FormItem {
  static readonly type = 'Form';

  private readonly keys: FormItem.Keys;

  constructor(private readonly attrs: FormItem.Attributes) {
    this.keys = {
      PK: FormItem.getPK(this.attrs.id),
      SK: FormItem.getSK(),
      GSI1PK: FormItem.getGSI1PK(this.attrs.accountId),
      GSI1SK: FormItem.getGSI1SK(this.attrs.id),
    };
  }

  toItem(): FormItem.ItemType {
    return {
      ...this.keys,
      ...this.attrs,
      type: FormItem.type,
    };
  }

  static fromEntity(form: Form) {
    return new FormItem({
      ...form,
      createdAt: form.createdAt.toISOString(),
    });
  }

  static toEntity(formItem: FormItem.ItemType) {
    return new Form({
      id: formItem.id,
      accountId: formItem.accountId,
      title: formItem.title,
      description: formItem.description,
      tags: formItem.tags,
      onePage: formItem.onePage,
      isAnonymous: formItem.isAnonymous,
      submissionCount: formItem.submissionCount,
      createdAt: new Date(formItem.createdAt),
    });
  }

  static getPK(formId: string): FormItem.Keys['PK'] {
    return `FORM#${formId}`;
  }

  static getSK(): FormItem.Keys['SK'] {
    return 'METADATA';
  }

  static getGSI1PK(accountId: string): FormItem.Keys['GSI1PK'] {
    return `ACCOUNT#${accountId}`;
  }

  static getGSI1SK(formId: string): FormItem.Keys['GSI1SK'] {
    return `FORM#${formId}`;
  }
}

export namespace FormItem {
  export type Keys = {
    PK: `FORM#${string}`;
    SK: 'METADATA';
    GSI1PK: `ACCOUNT#${string}`;
    GSI1SK: `FORM#${string}`;
  };

  export type Attributes = {
    id: string;
    accountId: string;
    title: string;
    description: string | undefined;
    tags?: string[];
    onePage: boolean;
    isAnonymous: boolean;
    submissionCount?: number;
    createdAt: string;
  };

  export type ItemType = Keys & Attributes & {
    type: 'Form';
  };
}
