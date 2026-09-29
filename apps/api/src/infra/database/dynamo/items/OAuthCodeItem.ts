export class OAuthCodeItem {
  static readonly type = 'OAuthCode';

  private readonly keys: OAuthCodeItem.Keys;

  constructor(private readonly attrs: OAuthCodeItem.Attributes) {
    this.keys = {
      PK: OAuthCodeItem.getPK(this.attrs.codeHash),
      SK: OAuthCodeItem.getSK(this.attrs.codeHash),
    };
  }

  toItem(): OAuthCodeItem.ItemType {
    return {
      ...this.keys,
      ...this.attrs,
      type: OAuthCodeItem.type,
    };
  }

  static toAttributes(item: OAuthCodeItem.ItemType): OAuthCodeItem.Attributes {
    return {
      codeHash: item.codeHash,
      accountId: item.accountId,
      clientId: item.clientId,
      redirectUri: item.redirectUri,
      codeChallenge: item.codeChallenge,
      createdAt: item.createdAt,
      expiresAt: item.expiresAt,
    };
  }

  static getPK(codeHash: string): OAuthCodeItem.Keys['PK'] {
    return `OAUTH_CODE#${codeHash}`;
  }

  static getSK(codeHash: string): OAuthCodeItem.Keys['SK'] {
    return `OAUTH_CODE#${codeHash}`;
  }
}

export namespace OAuthCodeItem {
  export type Keys = {
    PK: `OAUTH_CODE#${string}`;
    SK: `OAUTH_CODE#${string}`;
  };

  export type Attributes = {
    codeHash: string;
    accountId: string;
    clientId: string;
    redirectUri: string;
    codeChallenge: string;
    createdAt: string;
    /** Epoch seconds. Also the table's TTL attribute. */
    expiresAt: number;
  };

  export type ItemType = Keys & Attributes & {
    type: 'OAuthCode';
  };
}
