import KSUID from 'ksuid';
import { ApiKeyScope } from '../enums/ApiKeyScope';

export class ApiKey {
  readonly id: string;
  readonly accountId: string;
  readonly keyPrefix: string;
  readonly keyHash: string;
  name: string;
  scopes: ApiKeyScope[];
  readonly createdAt: Date;
  revokedAt?: Date;
  expiresAt?: Date;

  constructor(attr: ApiKey.Attributes) {
    this.id = attr.id ?? KSUID.randomSync().string;
    this.accountId = attr.accountId;
    this.keyPrefix = attr.keyPrefix;
    this.keyHash = attr.keyHash;
    this.name = attr.name;
    this.scopes = attr.scopes;
    this.createdAt = attr.createdAt ?? new Date();
    this.revokedAt = attr.revokedAt;
    this.expiresAt = attr.expiresAt;
  }
}

export namespace ApiKey {
  export type Attributes = {
    accountId: string;
    keyPrefix: string;
    keyHash: string;
    name: string;
    scopes: ApiKeyScope[];
    id?: string;
    createdAt?: Date;
    revokedAt?: Date;
    expiresAt?: Date;
  };
}
