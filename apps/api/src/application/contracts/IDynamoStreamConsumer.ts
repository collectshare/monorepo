import { DynamoDBRecord } from 'aws-lambda';

export interface IDynamoStreamConsumer {
  handle(record: DynamoDBRecord): Promise<void>;
}
