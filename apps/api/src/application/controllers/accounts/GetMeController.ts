import { Controller } from '@application/contracts/Controller';
import { GetMeUseCase } from '@application/usecases/accounts/GetMeUseCase';
import { Injectable } from '@kernel/decorators/Injectable';

@Injectable()
export class GetMeController extends Controller<'private', GetMeController.Response> {
  constructor(private readonly getMeUseCase: GetMeUseCase) {
    super();
  }

  protected override async handle({
    accountId,
  }: Controller.Request<'private'>): Promise<Controller.Response<GetMeController.Response>> {
    const response = await this.getMeUseCase.execute({ accountId });

    return {
      statusCode: 200,
      body: response,
    };
  }
}

export namespace GetMeController {
  export type Response = {
    id: string;
    name: string;
    email: string;
  }
}
