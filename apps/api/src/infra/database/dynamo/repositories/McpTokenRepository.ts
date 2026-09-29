import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { Injectable } from '@kernel/decorators/Injectable';
import { AppConfig } from '@shared/config/AppConfig';
import { McpTokenItem } from '../items/McpTokenItem';

@Injectable()
export class McpTokenRepository {
  constructor(private readonly config: AppConfig) { }

  async create(attrs: McpTokenItem.Attributes): Promise<void> {
    await dynamoClient.send(
      new PutCommand({
        TableName: this.config.db.dynamodb.mainTable,
        Item: new McpTokenItem(attrs).toItem(),
      }),
    );
  }

  async findByHash(tokenHash: string): Promise<McpTokenItem.Attributes | null> {
    const { Items = [] } = await dynamoClient.send(
      new QueryCommand({
        TableName: this.config.db.dynamodb.mainTable,
        IndexName: 'GSI1',
        KeyConditionExpression: '#GSI1PK = :GSI1PK',
        ExpressionAttributeNames: { '#GSI1PK': 'GSI1PK' },
        ExpressionAttributeValues: { ':GSI1PK': McpTokenItem.getGSI1PK(tokenHash) },
        Limit: 1,
      }),
    );

    if (Items.length === 0) {
      return null;
    }

    return McpTokenItem.toAttributes(Items[0] as McpTokenItem.ItemType);
  }

  /**
   * Marks a refresh token as used. Returns `false` when it had already been used, which
   * callers must treat as a reuse (theft) signal.
   */
  async markUsed(accountId: string, tokenId: string): Promise<boolean> {
    try {
      await dynamoClient.send(
        new UpdateCommand({
          TableName: this.config.db.dynamodb.mainTable,
          Key: {
            PK: McpTokenItem.getPK(accountId),
            SK: McpTokenItem.getSK(tokenId),
          },
          ConditionExpression: 'attribute_exists(#PK) AND attribute_not_exists(#usedAt)',
          UpdateExpression: 'SET #usedAt = :usedAt',
          ExpressionAttributeNames: { '#PK': 'PK', '#usedAt': 'usedAt' },
          ExpressionAttributeValues: { ':usedAt': new Date().toISOString() },
        }),
      );

      return true;
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        return false;
      }

      throw error;
    }
  }
}
