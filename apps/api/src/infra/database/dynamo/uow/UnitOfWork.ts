import { PutCommandInput, TransactWriteCommand, TransactWriteCommandInput } from '@aws-sdk/lib-dynamodb';
import { dynamoClient } from '@infra/clients/dynamoClient';

export abstract class UnitOfWork {
  private transactItems: NonNullable<TransactWriteCommandInput['TransactItems']> = [];

  protected addPut(putInput: PutCommandInput) {
    this.transactItems.push({ Put: putInput });
  }

  protected async commit() {
    // Handlers resolve their controller (and this unit of work) once per Lambda
    // container, so the instance is reused across requests. Take the pending
    // items and reset before sending: otherwise every request would re-send all
    // previous items until the transaction exceeds DynamoDB's 100-item limit —
    // and a failed commit must not poison the next request either.
    const transactItems = this.transactItems;
    this.transactItems = [];

    await dynamoClient.send(
      new TransactWriteCommand({
        TransactItems: transactItems,
      }),
    );
  }
}
