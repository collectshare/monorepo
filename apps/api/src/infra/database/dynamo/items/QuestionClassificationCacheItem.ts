import { AnonymizationSuggestion } from '@monorepo/shared/types/AnonymizationSuggestion';

export class QuestionClassificationCacheItem {
  static readonly type = 'QuestionClassificationCache';

  private readonly keys: QuestionClassificationCacheItem.Keys;

  constructor(private readonly attrs: QuestionClassificationCacheItem.Attributes) {
    this.keys = {
      PK: QuestionClassificationCacheItem.getPK(this.attrs.hash),
      SK: QuestionClassificationCacheItem.getSK(),
    };
  }

  toItem(): QuestionClassificationCacheItem.ItemType {
    return {
      ...this.keys,
      ...this.attrs,
      type: QuestionClassificationCacheItem.type,
    };
  }

  static fromSuggestion(
    hash: string,
    suggestion: AnonymizationSuggestion,
    expiresAt: number,
  ): QuestionClassificationCacheItem {
    return new QuestionClassificationCacheItem({ hash, suggestion, expiresAt });
  }

  static toSuggestion(item: QuestionClassificationCacheItem.ItemType): AnonymizationSuggestion {
    return item.suggestion;
  }

  static getPK(hash: string): QuestionClassificationCacheItem.Keys['PK'] {
    return `CLASSIFICATION#${hash}`;
  }

  static getSK(): QuestionClassificationCacheItem.Keys['SK'] {
    return 'METADATA';
  }
}

export namespace QuestionClassificationCacheItem {
  export type Keys = {
    PK: `CLASSIFICATION#${string}`;
    SK: 'METADATA';
  };

  export type Attributes = {
    hash: string;
    suggestion: AnonymizationSuggestion;
    expiresAt: number;
  };

  export type ItemType = Keys & Attributes & {
    type: 'QuestionClassificationCache';
  };
}
