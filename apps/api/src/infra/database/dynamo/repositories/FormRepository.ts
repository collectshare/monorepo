import { Form } from '@monorepo/shared/entities/Form';
import { PutCommand, PutCommandInput, QueryCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { Injectable } from '@kernel/decorators/Injectable';
import { AppConfig } from '@shared/config/AppConfig';
import { FormItem } from '../items/FormItem';

@Injectable()
export class FormRepository {
  constructor(private readonly config: AppConfig) { }

  async findById(formId: string): Promise<Form | null> {
    const command = new GetCommand({
      TableName: this.config.db.dynamodb.mainTable,
      Key: {
        PK: FormItem.getPK(formId),
        SK: FormItem.getSK(),
      },
    });

    const { Item } = await dynamoClient.send(command);
    const form = Item as FormItem.ItemType | undefined;

    if (!form) {
      return null;
    }

    return FormItem.toEntity(form);
  }

  async findByAccountId(accountId: string): Promise<Form[]> {
    const command = new QueryCommand({
      IndexName: 'GSI1',
      TableName: this.config.db.dynamodb.mainTable,
      KeyConditionExpression: '#GSI1PK = :GSI1PK',
      ExpressionAttributeNames: {
        '#GSI1PK': 'GSI1PK',
      },
      ExpressionAttributeValues: {
        ':GSI1PK': FormItem.getGSI1PK(accountId),
      },
    });

    const { Items = [] } = await dynamoClient.send(command);

    return Items.map(item => FormItem.toEntity(item as FormItem.ItemType));
  }

  getPutCommandInput(form: Form): PutCommandInput {
    const formItem = FormItem.fromEntity(form);

    return {
      TableName: this.config.db.dynamodb.mainTable,
      Item: formItem.toItem(),
    };
  }

  async incrementSubmissionCount(formId: string): Promise<void> {
    const command = new UpdateCommand({
      TableName: this.config.db.dynamodb.mainTable,
      Key: {
        PK: FormItem.getPK(formId),
        SK: FormItem.getSK(),
      },
      UpdateExpression: 'SET #submissionCount = if_not_exists(#submissionCount, :zero) + :incr',
      ExpressionAttributeNames: {
        '#submissionCount': 'submissionCount',
      },
      ExpressionAttributeValues: {
        ':incr': 1,
        ':zero': 0,
      },
    });

    await dynamoClient.send(command);
  }

  async create(form: Form): Promise<void> {
    await dynamoClient.send(
      new PutCommand(this.getPutCommandInput(form)),
    );
  }

  async update(form: Form): Promise<void> {
    await dynamoClient.send(
      new PutCommand(this.getPutCommandInput(form)),
    );
  }
}
