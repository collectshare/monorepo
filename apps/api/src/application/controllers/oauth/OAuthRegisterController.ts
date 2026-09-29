import { z } from 'zod';

import { Controller } from '@application/contracts/Controller';
import { OAuthError } from '@application/oauth/OAuthError';
import { oauthNoStoreHeaders, withOAuthErrors } from '@application/oauth/oauthResponse';
import { RegisterOAuthClientUseCase } from '@application/usecases/oauth/RegisterOAuthClientUseCase';
import { Injectable } from '@kernel/decorators/Injectable';

const registerSchema = z.object({
  redirect_uris: z.array(z.string().min(1)).min(1),
  client_name: z.string().optional(),
});

/** RFC 7591 Dynamic Client Registration, stateless. */
@Injectable()
export class OAuthRegisterController extends Controller<'public', OAuthRegisterController.Response | OAuthRegisterController.ErrorResponse> {
  constructor(private readonly registerOAuthClientUseCase: RegisterOAuthClientUseCase) {
    super();
  }

  protected override async handle(
    { body }: Controller.Request<'public'>,
  ) {
    return withOAuthErrors<OAuthRegisterController.Response>(async () => {
      const parsed = registerSchema.safeParse(body);

      if (!parsed.success) {
        throw new OAuthError('invalid_client_metadata', 'redirect_uris (non-empty array of strings) is required.');
      }

      const client = await this.registerOAuthClientUseCase.execute({
        redirectUris: parsed.data.redirect_uris,
        clientName: parsed.data.client_name,
      });

      return {
        statusCode: 201,
        headers: oauthNoStoreHeaders(),
        body: {
          client_id: client.clientId,
          client_name: client.clientName,
          redirect_uris: client.redirectUris,
          grant_types: ['authorization_code', 'refresh_token'],
          response_types: ['code'],
          token_endpoint_auth_method: 'none',
        },
      };
    });
  }
}

export namespace OAuthRegisterController {
  export type Response = {
    client_id: string;
    client_name: string;
    redirect_uris: string[];
    grant_types: string[];
    response_types: string[];
    token_endpoint_auth_method: 'none';
  };

  export type ErrorResponse = {
    error: string;
    error_description?: string;
  };
}
