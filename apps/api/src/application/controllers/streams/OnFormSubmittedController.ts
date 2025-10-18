import { Injectable } from '@kernel/decorators/Injectable';
import { IDynamoStreamConsumer } from '@application/contracts/IDynamoStreamConsumer';
import { DynamoDBStreamHandler } from 'aws-lambda';
import { OnFormSubmittedUseCase } from '@application/usecases/form/OnFormSubmittedUseCase';

@Injectable()
export class OnFormSubmittedController implements IDynamoStreamConsumer {
  constructor(private readonly onFormSubmittedUseCase: OnFormSubmittedUseCase) { }

  public async handle(
    record: Parameters<DynamoDBStreamHandler>[0]['Records'][number],
  ): Promise<void> {
    await this.onFormSubmittedUseCase.handle(record);
  }
}
