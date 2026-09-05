import { ApiKey } from '@monorepo/shared/entities/ApiKey';
import { ApiKeyScope } from '@monorepo/shared/enums/ApiKeyScope';

export class ApiKeyItem {
  static readonly type = 'ApiKey';

  private readonly keys: ApiKeyItem.Keys;

  constructor(private readonly attrs: ApiKeyItem.Attributes) {
    this.keys = {
      PK: ApiKeyItem.getPK(this.attrs.accountId),
      SK: ApiKeyItem.getSK(this.attrs.id),
      GSI1PK: ApiKeyItem.getGSI1PK(this.attrs.keyHash),
      GSI1SK: ApiKeyItem.getGSI1SK(this.attrs.id),
    };
  }

  toItem(): ApiKeyItem.ItemType {
    return {
      ...this.keys,
      ...this.attrs,
      type: ApiKeyItem.type,
    };
  }

  static fromEntity(apiKey: ApiKey) {
    return new ApiKeyItem({
      id: apiKey.id,
      accountId: apiKey.accountId,
      keyPrefix: apiKey.keyPrefix,
      keyHash: apiKey.keyHash,
      name: apiKey.name,
      scopes: apiKey.scopes,
      createdAt: apiKey.createdAt.toISOString(),
      revokedAt: apiKey.revokedAt?.toISOString(),
      expiresAt: apiKey.expiresAt?.toISOString(),
    });
  }

  static toEntity(item: ApiKeyItem.ItemType) {
    return new ApiKey({
      id: item.id,
      accountId: item.accountId,
      keyPrefix: item.keyPrefix,
      keyHash: item.keyHash,
      name: item.name,
      scopes: item.scopes,
      createdAt: new Date(item.createdAt),
      revokedAt: item.revokedAt ? new Date(item.revokedAt) : undefined,
      expiresAt: item.expiresAt ? new Date(item.expiresAt) : undefined,
    });
  }

  static getPK(accountId: string): ApiKeyItem.Keys['PK'] {
    return `ACCOUNT#${accountId}`;
  }

  static getSK(keyId: string): ApiKeyItem.Keys['SK'] {
    return `APIKEY#${keyId}`;
  }

  static getGSI1PK(keyHash: string): ApiKeyItem.Keys['GSI1PK'] {
    return `APIKEY_HASH#${keyHash}`;
  }

  static getGSI1SK(keyId: string): ApiKeyItem.Keys['GSI1SK'] {
    return `APIKEY#${keyId}`;
  }
}

export namespace ApiKeyItem {
  export type Keys = {
    PK: `ACCOUNT#${string}`;
    SK: `APIKEY#${string}`;
    GSI1PK: `APIKEY_HASH#${string}`;
    GSI1SK: `APIKEY#${string}`;
  };

  export type Attributes = {
    id: string;
    accountId: string;
    keyPrefix: string;
    keyHash: string;
    name: string;
    scopes: ApiKeyScope[];
    createdAt: string;
    revokedAt?: string;
    expiresAt?: string;
  };

  export type ItemType = Keys & Attributes & {
    type: 'ApiKey';
  };
}
