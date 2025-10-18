import { Controller } from '@application/contracts/Controller';
import { InsertQuestionsInFormUseCase } from '@application/usecases/form/InsertQuestionsInFormUseCase';
import { Injectable } from '@kernel/decorators/Injectable';
import { Schema } from '@kernel/decorators/Schema';
import {
  InsertQuestionsInFormBody,
  insertQuestionsInFormSchema,
} from './schemas/insertQuestionsInFormSchema';

@Injectable()
@Schema(insertQuestionsInFormSchema)
export class InsertQuestionsInFormController extends Controller<'private', void> {
  constructor(
    private readonly insertQuestionsInFormUseCase: InsertQuestionsInFormUseCase,
  ) {
    super();
  }

  protected override async handle({
    body,
    accountId,
    params,
  }: Controller.Request<'private', InsertQuestionsInFormBody, { formId: string }>)
  : Promise<Controller.Response> {
    await this.insertQuestionsInFormUseCase.execute({
      ...body,
      formId: params.formId,
      accountId,
    });

    return {
      statusCode: 204,
    };
  }
}
