import { createHmac, timingSafeEqual } from 'node:crypto';

import { Injectable } from '@kernel/decorators/Injectable';
import { AppConfig } from '@shared/config/AppConfig';

import { OAuthError } from './OAuthError';
import { BUILT_IN_REDIRECT_URIS, isRedirectUriAllowed } from './redirectUri';

const CLIENT_ID_VERSION = 1;
const MAX_REDIRECT_URIS = 10;
const MAX_CLIENT_NAME_LENGTH = 100;

type ClientPayload = {
  v: number;
  ru: string[];
  cn: string;
  iat: number;
};

/**
 * Stateless Dynamic Client Registration: the `client_id` is a signed blob carrying the
 * registered redirect URIs and display name, so nothing is stored per client.
 */
@Injectable()
export class OAuthClientService {
  constructor(private readonly appConfig: AppConfig) {}

  register({ redirectUris, clientName }: OAuthClientService.RegisterInput): OAuthClientService.Client {
    if (redirectUris.length === 0 || redirectUris.length > MAX_REDIRECT_URIS) {
      throw new OAuthError('invalid_redirect_uri', `Provide between 1 and ${MAX_REDIRECT_URIS} redirect_uris.`);
    }

    const allowList = this.getRedirectAllowList();

    for (const uri of redirectUris) {
      if (!isRedirectUriAllowed(uri, allowList)) {
        throw new OAuthError('invalid_redirect_uri', `redirect_uri is not allowed: ${uri}`);
      }
    }

    const name = (clientName ?? '').trim().slice(0, MAX_CLIENT_NAME_LENGTH) || 'MCP client';

    const payload: ClientPayload = {
      v: CLIENT_ID_VERSION,
      ru: redirectUris,
      cn: name,
      iat: Math.floor(Date.now() / 1000),
    };

    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');

    return {
      clientId: `${encodedPayload}.${this.sign(encodedPayload)}`,
      clientName: name,
      redirectUris,
    };
  }

  verify(clientId: string): OAuthClientService.Client {
    const [encodedPayload, signature, ...rest] = clientId.split('.');

    if (!encodedPayload || !signature || rest.length > 0 || !this.isValidSignature(encodedPayload, signature)) {
      throw new OAuthError('invalid_client', 'Unknown client_id.');
    }

    try {
      const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8')) as ClientPayload;

      if (payload.v !== CLIENT_ID_VERSION || !Array.isArray(payload.ru) || typeof payload.cn !== 'string') {
        throw new Error('Unsupported client_id payload');
      }

      return {
        clientId,
        clientName: payload.cn,
        redirectUris: payload.ru,
      };
    } catch {
      throw new OAuthError('invalid_client', 'Unknown client_id.');
    }
  }

  getRedirectAllowList(): string[] {
    return [...BUILT_IN_REDIRECT_URIS, ...this.appConfig.oauth.extraRedirectUris];
  }

  private sign(encodedPayload: string): string {
    return createHmac('sha256', this.appConfig.secrets.masterSecret)
      .update(`oauth-client-id.${encodedPayload}`)
      .digest('base64url');
  }

  private isValidSignature(encodedPayload: string, signature: string): boolean {
    const expected = Buffer.from(this.sign(encodedPayload));
    const received = Buffer.from(signature);

    return expected.length === received.length && timingSafeEqual(expected, received);
  }
}

export namespace OAuthClientService {
  export type RegisterInput = {
    redirectUris: string[];
    clientName?: string;
  };

  export type Client = {
    clientId: string;
    clientName: string;
    redirectUris: string[];
  };
}
