import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { Injectable } from '@kernel/decorators/Injectable';
import { AppConfig } from '@shared/config/AppConfig';
import { McpGrantItem } from '../items/McpGrantItem';

@Injectable()
export class McpGrantRepository {
  constructor(private readonly config: AppConfig) { }

  async create(attrs: McpGrantItem.Attributes): Promise<void> {
    await dynamoClient.send(
      new PutCommand({
        TableName: this.config.db.dynamodb.mainTable,
        Item: new McpGrantItem(attrs).toItem(),
      }),
    );
  }

  async findById(accountId: string, grantId: string): Promise<McpGrantItem.Attributes | null> {
    const { Item } = await dynamoClient.send(
      new GetCommand({
        TableName: this.config.db.dynamodb.mainTable,
        Key: {
          PK: McpGrantItem.getPK(accountId),
          SK: McpGrantItem.getSK(grantId),
        },
      }),
    );

    if (!Item) {
      return null;
    }

    return McpGrantItem.toAttributes(Item as McpGrantItem.ItemType);
  }

  async revoke(accountId: string, grantId: string): Promise<void> {
    await dynamoClient.send(
      new UpdateCommand({
        TableName: this.config.db.dynamodb.mainTable,
        Key: {
          PK: McpGrantItem.getPK(accountId),
          SK: McpGrantItem.getSK(grantId),
        },
        ConditionExpression: 'attribute_exists(#PK)',
        UpdateExpression: 'SET #revokedAt = if_not_exists(#revokedAt, :revokedAt)',
        ExpressionAttributeNames: { '#PK': 'PK', '#revokedAt': 'revokedAt' },
        ExpressionAttributeValues: { ':revokedAt': new Date().toISOString() },
      }),
    );
  }
}
