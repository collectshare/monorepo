import { DynamoDBRecord } from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';

import { IDynamoStreamConsumer } from '@application/contracts/IDynamoStreamConsumer';
import { FormSubmissionItem } from '@infra/database/dynamo/items/FormSubmissionItem';
import { FormRepository } from '@infra/database/dynamo/repositories/FormRepository';
import { Injectable } from '@kernel/decorators/Injectable';

@Injectable()
export class OnFormSubmittedUseCase implements IDynamoStreamConsumer {
  constructor(private readonly formRepository: FormRepository) { }

  async handle(record: DynamoDBRecord): Promise<void> {
    if (record.eventName !== 'INSERT') {
      return;
    }

    if (!record.dynamodb?.NewImage) {
      return;
    }

    const submission = unmarshall(record.dynamodb.NewImage as Record<string, any>) as FormSubmissionItem.ItemType;

    if (submission.type !== 'FormSubmission') {
      return;
    }

    const formId = submission.formId;

    await this.formRepository.incrementSubmissionCount(formId);
  }
}
