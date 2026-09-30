import { Controller } from '@application/contracts/Controller';
import type { OAuthErrorBody } from '@application/oauth/OAuthError';
import { withOAuthErrors } from '@application/oauth/oauthResponse';
import { ValidateAuthorizationRequestUseCase } from '@application/usecases/oauth/ValidateAuthorizationRequestUseCase';
import { Injectable } from '@kernel/decorators/Injectable';

/**
 * Step 1 of the consent page: validates the OAuth request (already carrying the user's Cognito
 * session) and returns what the page must display. Never redirects.
 */
@Injectable()
export class OAuthAuthorizeValidateController extends Controller<
  'private',
  OAuthAuthorizeValidateController.Response | OAuthErrorBody
> {
  constructor(private readonly validateAuthorizationRequestUseCase: ValidateAuthorizationRequestUseCase) {
    super();
  }

  protected override async handle(
    { queryParams }: Controller.Request<'private', any, Record<string, never>, OAuthAuthorizeValidateController.QueryParams>,
  ) {
    return withOAuthErrors<OAuthAuthorizeValidateController.Response>(async () => {
      const { clientName, redirectHost } = await this.validateAuthorizationRequestUseCase.execute({
        clientId: queryParams.client_id,
        redirectUri: queryParams.redirect_uri,
        responseType: queryParams.response_type,
        codeChallenge: queryParams.code_challenge,
        codeChallengeMethod: queryParams.code_challenge_method,
        resource: queryParams.resource,
      });

      return {
        statusCode: 200,
        body: { clientName, redirectHost },
      };
    });
  }
}

export namespace OAuthAuthorizeValidateController {
  export type QueryParams = {
    client_id?: string;
    redirect_uri?: string;
    response_type?: string;
    code_challenge?: string;
    code_challenge_method?: string;
    resource?: string;
    state?: string;
  };

  export type Response = {
    clientName: string;
    redirectHost: string;
  };
}
