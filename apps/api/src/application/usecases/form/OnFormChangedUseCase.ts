import { DynamoDBRecord } from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';

import { IDynamoStreamConsumer } from '@application/contracts/IDynamoStreamConsumer';
import { FormItem } from '@infra/database/dynamo/items/FormItem';
import { ProfileRepository } from '@infra/database/dynamo/repositories/ProfileRepository';
import { AlgoliaGateway } from '@infra/gateways/AlgoliaGateway';
import { Injectable } from '@kernel/decorators/Injectable';

@Injectable()
export class OnFormChangedUseCase implements IDynamoStreamConsumer {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly algoliaGateway: AlgoliaGateway,
  ) { }

  async handle(record: DynamoDBRecord): Promise<void> {
    if (record.eventName !== 'INSERT' && record.eventName !== 'MODIFY') {
      return;
    }

    if (!record.dynamodb?.NewImage) {
      return;
    }

    const form = unmarshall(record.dynamodb.NewImage as Record<string, any>) as FormItem.ItemType;

    if (form.type !== 'Form') {
      return;
    }

    if (!form.isPublished) {
      await this.algoliaGateway.deleteRecord(form.id);
      return;
    }

    const profile = await this.profileRepository.findByAccountId(form.accountId);

    await this.algoliaGateway.upsertRecord({
      formId: form.id,
      title: form.title,
      description: form.description,
      tags: form.tags,
      submissionCount: form.submissionCount,
      accountName: profile?.name ?? 'Anônimo',
      createdAt: form.createdAt,
    });
  }
}
