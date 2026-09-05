import { Injectable } from '@kernel/decorators/Injectable';
import { IDynamoStreamConsumer } from '@application/contracts/IDynamoStreamConsumer';
import { DynamoDBStreamHandler } from 'aws-lambda';
import { OnFormChangedUseCase } from '@application/usecases/form/OnFormChangedUseCase';

@Injectable()
export class OnFormChangedController implements IDynamoStreamConsumer {
  constructor(private readonly onFormChangedUseCase: OnFormChangedUseCase) { }

  public async handle(
    record: Parameters<DynamoDBStreamHandler>[0]['Records'][number],
  ): Promise<void> {
    await this.onFormChangedUseCase.handle(record);
  }
}
