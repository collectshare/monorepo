import { z } from 'zod';

import { Controller } from '@application/contracts/Controller';
import { OAuthError, OAuthErrorBody } from '@application/oauth/OAuthError';
import { NO_STORE_HEADERS, withOAuthErrors } from '@application/oauth/oauthResponse';
import { ExchangeAuthorizationCodeUseCase } from '@application/usecases/oauth/ExchangeAuthorizationCodeUseCase';
import { RefreshMcpTokenUseCase } from '@application/usecases/oauth/RefreshMcpTokenUseCase';
import { Injectable } from '@kernel/decorators/Injectable';

const tokenRequestSchema = z.object({
  grant_type: z.string().min(1),
  client_id: z.string().min(1),
  code: z.string().optional(),
  redirect_uri: z.string().optional(),
  code_verifier: z.string().optional(),
  refresh_token: z.string().optional(),
  resource: z.string().optional(),
});

/** RFC 6749 token endpoint (public client, PKCE): `authorization_code` and `refresh_token`. */
@Injectable()
export class OAuthTokenController extends Controller<
  'public',
  OAuthTokenController.Response | OAuthErrorBody
> {
  constructor(
    private readonly exchangeAuthorizationCodeUseCase: ExchangeAuthorizationCodeUseCase,
    private readonly refreshMcpTokenUseCase: RefreshMcpTokenUseCase,
  ) {
    super();
  }

  protected override async handle(
    { body }: Controller.Request<'public'>,
  ) {
    return withOAuthErrors<OAuthTokenController.Response>(async () => {
      const parsed = tokenRequestSchema.safeParse(body);

      if (!parsed.success) {
        throw new OAuthError('invalid_request', 'grant_type and client_id are required.');
      }

      const request = parsed.data;

      if (request.grant_type === 'authorization_code') {
        if (!request.code || !request.redirect_uri || !request.code_verifier) {
          throw new OAuthError('invalid_request', 'code, redirect_uri and code_verifier are required.');
        }

        const tokens = await this.exchangeAuthorizationCodeUseCase.execute({
          code: request.code,
          clientId: request.client_id,
          redirectUri: request.redirect_uri,
          codeVerifier: request.code_verifier,
          resource: request.resource,
        });

        return this.tokenResponse(tokens);
      }

      if (request.grant_type === 'refresh_token') {
        if (!request.refresh_token) {
          throw new OAuthError('invalid_request', 'refresh_token is required.');
        }

        const tokens = await this.refreshMcpTokenUseCase.execute({
          refreshToken: request.refresh_token,
          clientId: request.client_id,
          resource: request.resource,
        });

        return this.tokenResponse(tokens);
      }

      throw new OAuthError('unsupported_grant_type', 'grant_type must be authorization_code or refresh_token.');
    });
  }

  private tokenResponse(
    tokens: { accessToken: string; refreshToken: string; expiresIn: number },
  ): Controller.Response<OAuthTokenController.Response> {
    return {
      statusCode: 200,
      headers: NO_STORE_HEADERS,
      body: {
        access_token: tokens.accessToken,
        token_type: 'Bearer',
        expires_in: tokens.expiresIn,
        refresh_token: tokens.refreshToken,
      },
    };
  }
}

export namespace OAuthTokenController {
  export type Response = {
    access_token: string;
    token_type: 'Bearer';
    expires_in: number;
    refresh_token: string;
  };
}
