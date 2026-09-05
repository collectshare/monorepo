import { ApiKey } from '@monorepo/shared/entities/ApiKey';
import {
  PutCommand,
  PutCommandInput,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { Injectable } from '@kernel/decorators/Injectable';
import { AppConfig } from '@shared/config/AppConfig';
import { ApiKeyItem } from '../items/ApiKeyItem';

@Injectable()
export class ApiKeyRepository {
  constructor(private readonly config: AppConfig) { }

  async findByAccountId(accountId: string): Promise<ApiKey[]> {
    const command = new QueryCommand({
      TableName: this.config.db.dynamodb.mainTable,
      KeyConditionExpression: '#PK = :PK AND begins_with(#SK, :SK)',
      ExpressionAttributeNames: { '#PK': 'PK', '#SK': 'SK' },
      ExpressionAttributeValues: {
        ':PK': ApiKeyItem.getPK(accountId),
        ':SK': 'APIKEY#',
      },
    });

    const { Items = [] } = await dynamoClient.send(command);
    return Items.map(item => ApiKeyItem.toEntity(item as ApiKeyItem.ItemType));
  }

  async findByHash(keyHash: string): Promise<ApiKey | null> {
    const command = new QueryCommand({
      TableName: this.config.db.dynamodb.mainTable,
      IndexName: 'GSI1',
      KeyConditionExpression: '#GSI1PK = :GSI1PK',
      ExpressionAttributeNames: { '#GSI1PK': 'GSI1PK' },
      ExpressionAttributeValues: {
        ':GSI1PK': ApiKeyItem.getGSI1PK(keyHash),
      },
      Limit: 1,
    });

    const { Items = [] } = await dynamoClient.send(command);
    if (Items.length === 0) { return null; }
    return ApiKeyItem.toEntity(Items[0] as ApiKeyItem.ItemType);
  }

  getPutCommandInput(apiKey: ApiKey): PutCommandInput {
    return {
      TableName: this.config.db.dynamodb.mainTable,
      Item: ApiKeyItem.fromEntity(apiKey).toItem(),
    };
  }

  async create(apiKey: ApiKey): Promise<void> {
    await dynamoClient.send(new PutCommand(this.getPutCommandInput(apiKey)));
  }

  async revoke(accountId: string, keyId: string): Promise<void> {
    await dynamoClient.send(
      new UpdateCommand({
        TableName: this.config.db.dynamodb.mainTable,
        Key: {
          PK: ApiKeyItem.getPK(accountId),
          SK: ApiKeyItem.getSK(keyId),
        },
        ConditionExpression: 'attribute_exists(#PK)',
        UpdateExpression: 'SET #revokedAt = :revokedAt',
        ExpressionAttributeNames: { '#PK': 'PK', '#revokedAt': 'revokedAt' },
        ExpressionAttributeValues: { ':revokedAt': new Date().toISOString() },
      }),
    );
  }
}
