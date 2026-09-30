import { Controller } from '@application/contracts/Controller';
import { Injectable } from '@kernel/decorators/Injectable';
import { AppConfig } from '@shared/config/AppConfig';

/** RFC 8414 authorization server metadata. The authorization endpoint is the web consent page. */
@Injectable()
export class OAuthAuthorizationServerMetadataController extends Controller<
  'public',
  OAuthAuthorizationServerMetadataController.Response
> {
  constructor(private readonly appConfig: AppConfig) {
    super();
  }

  protected override async handle(): Promise<Controller.Response<OAuthAuthorizationServerMetadataController.Response>> {
    const { issuer, webAppUrl } = this.appConfig.oauth;

    return {
      statusCode: 200,
      headers: { 'Cache-Control': 'public, max-age=3600' },
      body: {
        issuer,
        authorization_endpoint: `${webAppUrl}/oauth/authorize`,
        token_endpoint: `${issuer}/oauth/token`,
        registration_endpoint: `${issuer}/oauth/register`,
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        code_challenge_methods_supported: ['S256'],
        token_endpoint_auth_methods_supported: ['none'],
      },
    };
  }
}

export namespace OAuthAuthorizationServerMetadataController {
  export type Response = {
    issuer: string;
    authorization_endpoint: string;
    token_endpoint: string;
    registration_endpoint: string;
    response_types_supported: string[];
    grant_types_supported: string[];
    code_challenge_methods_supported: string[];
    token_endpoint_auth_methods_supported: string[];
  };
}
