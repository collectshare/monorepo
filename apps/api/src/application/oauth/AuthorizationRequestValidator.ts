import { Injectable } from '@kernel/decorators/Injectable';
import { AppConfig } from '@shared/config/AppConfig';

import { OAuthClientService } from './OAuthClientService';
import { OAuthError } from './OAuthError';
import { isValidCodeChallenge } from './pkce';
import { redirectUriMatches } from './redirectUri';

/** Validation shared by the "show consent" (GET) and "decide" (POST) authorize steps. */
@Injectable()
export class AuthorizationRequestValidator {
  constructor(
    private readonly oauthClientService: OAuthClientService,
    private readonly appConfig: AppConfig,
  ) {}

  validate(params: AuthorizationRequestValidator.Params): AuthorizationRequestValidator.Result {
    const client = this.verifyClient(params.clientId);

    if (!params.redirectUri || !redirectUriMatches(client.redirectUris, params.redirectUri)) {
      throw new OAuthError('invalid_request', 'redirect_uri does not match a registered redirect URI.');
    }

    if (params.responseType !== 'code') {
      throw new OAuthError('invalid_request', 'response_type must be "code".');
    }

    if (params.codeChallengeMethod !== 'S256') {
      throw new OAuthError('invalid_request', 'code_challenge_method must be "S256".');
    }

    if (!params.codeChallenge || !isValidCodeChallenge(params.codeChallenge)) {
      throw new OAuthError('invalid_request', 'code_challenge is missing or malformed.');
    }

    this.assertResource(params.resource);

    return {
      client,
      redirectHost: this.getRedirectHost(params.redirectUri),
    };
  }

  /** RFC 8707: when the client names a resource it must be this server's MCP endpoint. */
  assertResource(resource: string | undefined): void {
    if (resource === undefined || resource === '') {
      return;
    }

    const expected = `${this.appConfig.oauth.issuer}/mcp`;

    if (resource.replace(/\/+$/, '') !== expected) {
      throw new OAuthError('invalid_target', `resource must be ${expected}.`);
    }
  }

  private verifyClient(clientId: string | undefined): OAuthClientService.Client {
    try {
      return this.oauthClientService.verify(clientId ?? '');
    } catch (error) {
      if (error instanceof OAuthError) {
        // At the authorize step an unknown client is a bad request, not a failed client authentication.
        throw new OAuthError('invalid_request', 'Unknown client_id.');
      }

      throw error;
    }
  }

  private getRedirectHost(redirectUri: string): string {
    const url = new URL(redirectUri);

    return url.host || url.protocol;
  }
}

export namespace AuthorizationRequestValidator {
  export type Params = {
    clientId?: string;
    redirectUri?: string;
    responseType?: string;
    codeChallenge?: string;
    codeChallengeMethod?: string;
    resource?: string;
  };

  export type Result = {
    client: OAuthClientService.Client;
    redirectHost: string;
  };
}
