import { AnonymizationSuggestion } from '@monorepo/shared/types/AnonymizationSuggestion';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { Injectable } from '@kernel/decorators/Injectable';
import { AppConfig } from '@shared/config/AppConfig';
import { QuestionClassificationCacheItem } from '../items/QuestionClassificationCacheItem';

const CACHE_TTL_SECONDS = 90 * 24 * 60 * 60;

@Injectable()
export class QuestionClassificationCacheRepository {
  constructor(private readonly config: AppConfig) { }

  async get(hash: string): Promise<AnonymizationSuggestion | null> {
    const command = new GetCommand({
      TableName: this.config.db.dynamodb.mainTable,
      Key: {
        PK: QuestionClassificationCacheItem.getPK(hash),
        SK: QuestionClassificationCacheItem.getSK(),
      },
    });

    const { Item } = await dynamoClient.send(command);
    const item = Item as QuestionClassificationCacheItem.ItemType | undefined;

    if (!item) {
      return null;
    }

    return QuestionClassificationCacheItem.toSuggestion(item);
  }

  async put(hash: string, suggestion: AnonymizationSuggestion): Promise<void> {
    const expiresAt = Math.floor(Date.now() / 1000) + CACHE_TTL_SECONDS;
    const item = QuestionClassificationCacheItem.fromSuggestion(hash, suggestion, expiresAt);

    await dynamoClient.send(
      new PutCommand({
        TableName: this.config.db.dynamodb.mainTable,
        Item: item.toItem(),
      }),
    );
  }
}
