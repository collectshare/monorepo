import { Controller } from '@application/contracts/Controller';
import { Injectable } from '@kernel/decorators/Injectable';
import { AppConfig } from '@shared/config/AppConfig';

/** RFC 9728 protected resource metadata for the MCP endpoint. */
@Injectable()
export class OAuthProtectedResourceMetadataController extends Controller<
  'public',
  OAuthProtectedResourceMetadataController.Response
> {
  constructor(private readonly appConfig: AppConfig) {
    super();
  }

  protected override async handle(): Promise<Controller.Response<OAuthProtectedResourceMetadataController.Response>> {
    const { issuer } = this.appConfig.oauth;

    return {
      statusCode: 200,
      headers: { 'Cache-Control': 'public, max-age=3600' },
      body: {
        resource: `${issuer}/mcp`,
        authorization_servers: [issuer],
        bearer_methods_supported: ['header'],
      },
    };
  }
}

export namespace OAuthProtectedResourceMetadataController {
  export type Response = {
    resource: string;
    authorization_servers: string[];
    bearer_methods_supported: string[];
  };
}
