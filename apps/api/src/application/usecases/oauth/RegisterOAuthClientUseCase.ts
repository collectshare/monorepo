import { OAuthClientService } from '@application/oauth/OAuthClientService';
import { Injectable } from '@kernel/decorators/Injectable';

@Injectable()
export class RegisterOAuthClientUseCase {
  constructor(private readonly oauthClientService: OAuthClientService) {}

  async execute(input: RegisterOAuthClientUseCase.Input): Promise<RegisterOAuthClientUseCase.Output> {
    return this.oauthClientService.register(input);
  }
}

export namespace RegisterOAuthClientUseCase {
  export type Input = OAuthClientService.RegisterInput;

  export type Output = OAuthClientService.Client;
}
