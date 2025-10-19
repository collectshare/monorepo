import { Answer } from '@monorepo/shared/entities/Answer';
import { PutCommand, PutCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { Injectable } from '@kernel/decorators/Injectable';
import { AppConfig } from '@shared/config/AppConfig';
import { AnswerItem } from '../items/AnswerItem';

@Injectable()
export class AnswerRepository {
  constructor(private readonly config: AppConfig) { }

  async findBySubmissionId(submissionId: string): Promise<Answer[]> {
    const command = new QueryCommand({
      TableName: this.config.db.dynamodb.mainTable,
      KeyConditionExpression: '#PK = :PK',
      ExpressionAttributeNames: {
        '#PK': 'PK',
      },
      ExpressionAttributeValues: {
        ':PK': AnswerItem.getPK(submissionId),
      },
    });

    const { Items = [] } = await dynamoClient.send(command);

    return Items.map(item => AnswerItem.toEntity(item as AnswerItem.ItemType));
  }

  getPutCommandInput(answer: Answer): PutCommandInput {
    const answerItem = AnswerItem.fromEntity(answer);

    return {
      TableName: this.config.db.dynamodb.mainTable,
      Item: answerItem.toItem(),
    };
  }

  async create(answer: Answer): Promise<void> {
    await dynamoClient.send(
      new PutCommand(this.getPutCommandInput(answer)),
    );
  }
}
