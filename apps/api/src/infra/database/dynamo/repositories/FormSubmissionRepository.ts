import { FormSubmission } from '@monorepo/shared/entities/FormSubmission';
import { PutCommand, PutCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { Injectable } from '@kernel/decorators/Injectable';
import { AppConfig } from '@shared/config/AppConfig';
import { FormSubmissionItem } from '../items/FormSubmissionItem';

@Injectable()
export class FormSubmissionRepository {
  constructor(private readonly config: AppConfig) { }

  async findByFormId(formId: string): Promise<FormSubmission[]> {
    const command = new QueryCommand({
      TableName: this.config.db.dynamodb.mainTable,
      KeyConditionExpression: '#PK = :PK AND begins_with(#SK, :SK)',
      ExpressionAttributeNames: {
        '#PK': 'PK',
        '#SK': 'SK',
      },
      ExpressionAttributeValues: {
        ':PK': FormSubmissionItem.getPK(formId),
        ':SK': 'SUBMISSION#',
      },
    });

    const { Items = [] } = await dynamoClient.send(command);

    return Items.map(item => FormSubmissionItem.toEntity(item as FormSubmissionItem.ItemType));
  }

  async findByFormIdPaginated(
    formId: string,
    { limit, cursor }: { limit: number; cursor?: string },
  ): Promise<{ submissions: FormSubmission[]; nextCursor?: string }> {
    const command = new QueryCommand({
      TableName: this.config.db.dynamodb.mainTable,
      KeyConditionExpression: '#PK = :PK AND begins_with(#SK, :SK)',
      ExpressionAttributeNames: {
        '#PK': 'PK',
        '#SK': 'SK',
      },
      ExpressionAttributeValues: {
        ':PK': FormSubmissionItem.getPK(formId),
        ':SK': 'SUBMISSION#',
      },
      Limit: limit,
      ExclusiveStartKey: cursor ? decodeCursor(cursor) : undefined,
    });

    const { Items = [], LastEvaluatedKey } = await dynamoClient.send(command);

    return {
      submissions: Items.map(item => FormSubmissionItem.toEntity(item as FormSubmissionItem.ItemType)),
      nextCursor: LastEvaluatedKey ? encodeCursor(LastEvaluatedKey) : undefined,
    };
  }

  getPutCommandInput(submission: FormSubmission): PutCommandInput {
    const submissionItem = FormSubmissionItem.fromEntity(submission);

    return {
      TableName: this.config.db.dynamodb.mainTable,
      Item: submissionItem.toItem(),
    };
  }

  async create(submission: FormSubmission): Promise<void> {
    await dynamoClient.send(
      new PutCommand(this.getPutCommandInput(submission)),
    );
  }
}

function encodeCursor(key: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(key)).toString('base64');
}

function decodeCursor(cursor: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
}
