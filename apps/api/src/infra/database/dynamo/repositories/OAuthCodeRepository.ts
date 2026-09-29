import { DeleteCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { Injectable } from '@kernel/decorators/Injectable';
import { AppConfig } from '@shared/config/AppConfig';
import { OAuthCodeItem } from '../items/OAuthCodeItem';

@Injectable()
export class OAuthCodeRepository {
  constructor(private readonly config: AppConfig) { }

  async create(attrs: OAuthCodeItem.Attributes): Promise<void> {
    await dynamoClient.send(
      new PutCommand({
        TableName: this.config.db.dynamodb.mainTable,
        Item: new OAuthCodeItem(attrs).toItem(),
      }),
    );
  }

  /**
   * Atomically deletes the code and returns it, so a code can only be redeemed once even
   * under concurrent requests. Returns `null` when it does not exist (or was already used).
   */
  async consume(codeHash: string): Promise<OAuthCodeItem.Attributes | null> {
    const { Attributes } = await dynamoClient.send(
      new DeleteCommand({
        TableName: this.config.db.dynamodb.mainTable,
        Key: {
          PK: OAuthCodeItem.getPK(codeHash),
          SK: OAuthCodeItem.getSK(codeHash),
        },
        ReturnValues: 'ALL_OLD',
      }),
    );

    if (!Attributes) {
      return null;
    }

    return OAuthCodeItem.toAttributes(Attributes as OAuthCodeItem.ItemType);
  }
}
