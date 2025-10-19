import { Question } from '@monorepo/shared/entities/Question';
import {
  PutCommand,
  PutCommandInput,
  QueryCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { Injectable } from '@kernel/decorators/Injectable';
import { AppConfig } from '@shared/config/AppConfig';
import { chunk } from '@shared/utils/chunk';
import { QuestionItem } from '../items/QuestionItem';

@Injectable()
export class QuestionRepository {
  constructor(private readonly config: AppConfig) { }

  async findByFormId(formId: string): Promise<Question[]> {
    const command = new QueryCommand({
      TableName: this.config.db.dynamodb.mainTable,
      KeyConditionExpression: '#PK = :PK AND begins_with(#SK, :SK)',
      ExpressionAttributeNames: {
        '#PK': 'PK',
        '#SK': 'SK',
      },
      ExpressionAttributeValues: {
        ':PK': QuestionItem.getPK(formId),
        ':SK': 'QUESTION#',
      },
    });

    const { Items = [] } = await dynamoClient.send(command);

    return Items.map(item =>
      QuestionItem.toEntity(item as QuestionItem.ItemType),
    );
  }

  getPutCommandInput(question: Question): PutCommandInput {
    const questionItem = QuestionItem.fromEntity(question);

    return {
      TableName: this.config.db.dynamodb.mainTable,
      Item: questionItem.toItem(),
    };
  }

  async create(question: Question): Promise<void> {
    await dynamoClient.send(new PutCommand(this.getPutCommandInput(question)));
  }

  async saveMany(questions: Question[]): Promise<void> {
    const questionChunks = chunk(questions, 25);

    await Promise.all(
      questionChunks.map(questionChunk => {
        const command = new BatchWriteCommand({
          RequestItems: {
            [this.config.db.dynamodb.mainTable]: questionChunk.map(
              question => ({
                PutRequest: {
                  Item: QuestionItem.fromEntity(question).toItem(),
                },
              }),
            ),
          },
        });

        return dynamoClient.send(command);
      }),
    );
  }

  async deleteMany(formId: string, questionIds: string[]): Promise<void> {
    const questionIdChunks = chunk(questionIds, 25);

    await Promise.all(
      questionIdChunks.map(questionIdChunk => {
        const command = new BatchWriteCommand({
          RequestItems: {
            [this.config.db.dynamodb.mainTable]: questionIdChunk.map(
              questionId => ({
                DeleteRequest: {
                  Key: {
                    PK: QuestionItem.getPK(formId),
                    SK: QuestionItem.getSK(questionId),
                  },
                },
              }),
            ),
          },
        });

        return dynamoClient.send(command);
      }),
    );
  }
}
