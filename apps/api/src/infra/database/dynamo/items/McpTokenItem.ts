export class McpTokenItem {
  static readonly type = 'McpToken';

  private readonly keys: McpTokenItem.Keys;

  constructor(private readonly attrs: McpTokenItem.Attributes) {
    this.keys = {
      PK: McpTokenItem.getPK(this.attrs.accountId),
      SK: McpTokenItem.getSK(this.attrs.id),
      GSI1PK: McpTokenItem.getGSI1PK(this.attrs.tokenHash),
      GSI1SK: McpTokenItem.getGSI1SK(this.attrs.id),
    };
  }

  toItem(): McpTokenItem.ItemType {
    return {
      ...this.keys,
      ...this.attrs,
      type: McpTokenItem.type,
    };
  }

  static toAttributes(item: McpTokenItem.ItemType): McpTokenItem.Attributes {
    return {
      id: item.id,
      accountId: item.accountId,
      grantId: item.grantId,
      kind: item.kind,
      tokenHash: item.tokenHash,
      createdAt: item.createdAt,
      expiresAt: item.expiresAt,
      usedAt: item.usedAt,
    };
  }

  static getPK(accountId: string): McpTokenItem.Keys['PK'] {
    return `ACCOUNT#${accountId}`;
  }

  static getSK(tokenId: string): McpTokenItem.Keys['SK'] {
    return `MCPTOKEN#${tokenId}`;
  }

  static getGSI1PK(tokenHash: string): McpTokenItem.Keys['GSI1PK'] {
    return `MCPTOKEN_HASH#${tokenHash}`;
  }

  static getGSI1SK(tokenId: string): McpTokenItem.Keys['GSI1SK'] {
    return `MCPTOKEN#${tokenId}`;
  }
}

export namespace McpTokenItem {
  export type Kind = 'access' | 'refresh';

  export type Keys = {
    PK: `ACCOUNT#${string}`;
    SK: `MCPTOKEN#${string}`;
    GSI1PK: `MCPTOKEN_HASH#${string}`;
    GSI1SK: `MCPTOKEN#${string}`;
  };

  export type Attributes = {
    id: string;
    accountId: string;
    grantId: string;
    kind: Kind;
    tokenHash: string;
    createdAt: string;
    /** Epoch seconds. Also the table's TTL attribute. */
    expiresAt: number;
    /** Set when a refresh token has been exchanged; a second use signals token theft. */
    usedAt?: string;
  };

  export type ItemType = Keys & Attributes & {
    type: 'McpToken';
  };
}
