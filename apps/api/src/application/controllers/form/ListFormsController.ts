import { Controller } from '@application/contracts/Controller';
import { Form } from '@monorepo/shared/entities/Form';
import { ListFormsUseCase } from '@application/usecases/form/ListFormsUseCase';
import { Injectable } from '@kernel/decorators/Injectable';

@Injectable()
export class ListFormsController extends Controller<'private', ListFormsController.Response> {
  constructor(private readonly listFormsUseCase: ListFormsUseCase) {
    super();
  }

  protected override async handle(
    { accountId }: Controller.Request<'private'>,
  ): Promise<Controller.Response<ListFormsController.Response>> {
    const { forms } = await this.listFormsUseCase.execute({
      accountId,
    });

    return {
      statusCode: 200,
      body: {
        forms,
      },
    };
  }
}

export namespace ListFormsController {
  export type Response = {
    forms: Form[];
  };
}
