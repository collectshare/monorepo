import { AuthorizationRequestValidator } from '@application/oauth/AuthorizationRequestValidator';
import { McpTokenService, OAUTH_CODE_TTL_SECONDS } from '@application/oauth/McpTokenService';
import { OAuthCodeRepository } from '@infra/database/dynamo/repositories/OAuthCodeRepository';
import { Injectable } from '@kernel/decorators/Injectable';

@Injectable()
export class DecideAuthorizationUseCase {
  constructor(
    private readonly authorizationRequestValidator: AuthorizationRequestValidator,
    private readonly mcpTokenService: McpTokenService,
    private readonly oauthCodeRepository: OAuthCodeRepository,
  ) {}

  async execute({
    accountId,
    decision,
    state,
    ...params
  }: DecideAuthorizationUseCase.Input): Promise<DecideAuthorizationUseCase.Output> {
    // Re-validate everything: the consent page is not trusted.
    this.authorizationRequestValidator.validate(params);

    const redirectUrl = new URL(params.redirectUri!);

    if (decision === 'deny') {
      redirectUrl.searchParams.set('error', 'access_denied');
    } else {
      const code = this.mcpTokenService.generate();
      const now = Date.now();

      await this.oauthCodeRepository.create({
        codeHash: this.mcpTokenService.hashAuthorizationCode(code),
        accountId,
        clientId: params.clientId!,
        redirectUri: params.redirectUri!,
        codeChallenge: params.codeChallenge!,
        createdAt: new Date(now).toISOString(),
        expiresAt: Math.floor(now / 1000) + OAUTH_CODE_TTL_SECONDS,
      });

      redirectUrl.searchParams.set('code', code);
    }

    if (state) {
      redirectUrl.searchParams.set('state', state);
    }

    return { redirectTo: redirectUrl.toString() };
  }
}

export namespace DecideAuthorizationUseCase {
  export type Input = AuthorizationRequestValidator.Params & {
    accountId: string;
    decision: 'approve' | 'deny';
    state?: string;
  };

  export type Output = {
    redirectTo: string;
  };
}
