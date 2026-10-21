import KSUID from 'ksuid';

export class Form {
  readonly id: string;
  readonly accountId: string;
  readonly createdAt: Date;
  readonly submissionCount?: number;
  readonly clickCount?: number;
  readonly downloadCount?: number;
  title: string;
  description: string | undefined;
  descriptionAlign?: Form.DescriptionAlign;
  tags?: string[];
  onePage: boolean;

  constructor(attr: Form.Attributes) {
    this.id = attr.id ?? KSUID.randomSync().string;
    this.accountId = attr.accountId;
    this.title = attr.title;
    this.description = attr.description;
    this.descriptionAlign = attr.descriptionAlign;
    this.createdAt = attr.createdAt ?? new Date();
    this.tags = attr.tags;
    this.submissionCount = attr.submissionCount;
    this.clickCount = attr.clickCount;
    this.downloadCount = attr.downloadCount;
    this.onePage = attr.onePage;
  }
}

export namespace Form {
  // Alinhamento da descrição inteira na tela de resposta; ausente = centro.
  export type DescriptionAlign = 'left' | 'center' | 'right';

  export type Attributes = {
    accountId: string;
    title: string;
    description?: string;
    descriptionAlign?: DescriptionAlign;
    id?: string;
    createdAt?: Date;
    tags?: string[];
    onePage: boolean;
    submissionCount?: number;
    clickCount?: number;
    downloadCount?: number;
  };
}
