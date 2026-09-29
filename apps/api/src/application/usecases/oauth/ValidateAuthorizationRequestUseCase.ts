import { AuthorizationRequestValidator } from '@application/oauth/AuthorizationRequestValidator';
import { Injectable } from '@kernel/decorators/Injectable';

@Injectable()
export class ValidateAuthorizationRequestUseCase {
  constructor(private readonly authorizationRequestValidator: AuthorizationRequestValidator) {}

  async execute(input: ValidateAuthorizationRequestUseCase.Input): Promise<ValidateAuthorizationRequestUseCase.Output> {
    const { client, redirectHost } = this.authorizationRequestValidator.validate(input);

    return {
      clientName: client.clientName,
      redirectHost,
    };
  }
}

export namespace ValidateAuthorizationRequestUseCase {
  export type Input = AuthorizationRequestValidator.Params;

  export type Output = {
    clientName: string;
    redirectHost: string;
  };
}
