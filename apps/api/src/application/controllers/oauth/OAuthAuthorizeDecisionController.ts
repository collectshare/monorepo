import { z } from 'zod';

import { Controller } from '@application/contracts/Controller';
import { OAuthError, OAuthErrorBody } from '@application/oauth/OAuthError';
import { withOAuthErrors } from '@application/oauth/oauthResponse';
import { DecideAuthorizationUseCase } from '@application/usecases/oauth/DecideAuthorizationUseCase';
import { Injectable } from '@kernel/decorators/Injectable';

const decisionSchema = z.object({
  client_id: z.string().optional(),
  redirect_uri: z.string().optional(),
  response_type: z.string().optional(),
  code_challenge: z.string().optional(),
  code_challenge_method: z.string().optional(),
  resource: z.string().optional(),
  state: z.string().optional(),
  decision: z.enum(['approve', 'deny']),
});

/** Step 2 of the consent page: records the user's decision and returns the redirect to follow. */
@Injectable()
export class OAuthAuthorizeDecisionController extends Controller<
  'private',
  OAuthAuthorizeDecisionController.Response | OAuthErrorBody
> {
  constructor(private readonly decideAuthorizationUseCase: DecideAuthorizationUseCase) {
    super();
  }

  protected override async handle(
    { body, accountId }: Controller.Request<'private'>,
  ) {
    return withOAuthErrors<OAuthAuthorizeDecisionController.Response>(async () => {
      const parsed = decisionSchema.safeParse(body);

      if (!parsed.success) {
        throw new OAuthError('invalid_request', 'decision must be "approve" or "deny".');
      }

      const data = parsed.data;

      const { redirectTo } = await this.decideAuthorizationUseCase.execute({
        accountId,
        decision: data.decision,
        state: data.state,
        clientId: data.client_id,
        redirectUri: data.redirect_uri,
        responseType: data.response_type,
        codeChallenge: data.code_challenge,
        codeChallengeMethod: data.code_challenge_method,
        resource: data.resource,
      });

      return {
        statusCode: 200,
        body: { redirectTo },
      };
    });
  }
}

export namespace OAuthAuthorizeDecisionController {
  export type Response = {
    redirectTo: string;
  };
}
