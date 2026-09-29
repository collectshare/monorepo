/** One MCP connection: an account that authorized a given OAuth client. */
export class McpGrantItem {
  static readonly type = 'McpGrant';

  private readonly keys: McpGrantItem.Keys;

  constructor(private readonly attrs: McpGrantItem.Attributes) {
    this.keys = {
      PK: McpGrantItem.getPK(this.attrs.accountId),
      SK: McpGrantItem.getSK(this.attrs.id),
    };
  }

  toItem(): McpGrantItem.ItemType {
    return {
      ...this.keys,
      ...this.attrs,
      type: McpGrantItem.type,
    };
  }

  static toAttributes(item: McpGrantItem.ItemType): McpGrantItem.Attributes {
    return {
      id: item.id,
      accountId: item.accountId,
      clientId: item.clientId,
      clientName: item.clientName,
      createdAt: item.createdAt,
      lastUsedAt: item.lastUsedAt,
      revokedAt: item.revokedAt,
    };
  }

  static getPK(accountId: string): McpGrantItem.Keys['PK'] {
    return `ACCOUNT#${accountId}`;
  }

  static getSK(grantId: string): McpGrantItem.Keys['SK'] {
    return `MCPGRANT#${grantId}`;
  }
}

export namespace McpGrantItem {
  export type Keys = {
    PK: `ACCOUNT#${string}`;
    SK: `MCPGRANT#${string}`;
  };

  export type Attributes = {
    id: string;
    accountId: string;
    clientId: string;
    clientName: string;
    createdAt: string;
    lastUsedAt?: string;
    revokedAt?: string;
  };

  export type ItemType = Keys & Attributes & {
    type: 'McpGrant';
  };
}
