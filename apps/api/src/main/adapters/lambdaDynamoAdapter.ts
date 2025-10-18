import { DynamoDBStreamHandler } from 'aws-lambda';

import { IDynamoStreamConsumer } from '@application/contracts/IDynamoStreamConsumer';

export function lambdaDynamoAdapter(consumer: IDynamoStreamConsumer): DynamoDBStreamHandler {
  return async (event) => {
    const responses = await Promise.allSettled(
      event.Records.map(record => consumer.handle(record)),
    );

    const failedEvents = responses.filter(
      response => response.status === 'rejected',
    );

    for (const event of failedEvents) {
      // eslint-disable-next-line no-console
      console.error(JSON.stringify(event.reason, null, 2));
    }
  };
}
