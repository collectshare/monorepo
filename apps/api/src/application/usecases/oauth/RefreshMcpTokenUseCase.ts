import { AuthorizationRequestValidator } from '@application/oauth/AuthorizationRequestValidator';
import { McpTokenIssuer } from '@application/oauth/McpTokenIssuer';
import { MCP_REFRESH_TOKEN_PREFIX, McpTokenService } from '@application/oauth/McpTokenService';
import { OAuthClientService } from '@application/oauth/OAuthClientService';
import { OAuthError } from '@application/oauth/OAuthError';
import { AccountRepository } from '@infra/database/dynamo/repositories/AccountRepository';
import { McpGrantRepository } from '@infra/database/dynamo/repositories/McpGrantRepository';
import { McpTokenRepository } from '@infra/database/dynamo/repositories/McpTokenRepository';
import { Injectable } from '@kernel/decorators/Injectable';

@Injectable()
export class RefreshMcpTokenUseCase {
  constructor(
    private readonly oauthClientService: OAuthClientService,
    private readonly authorizationRequestValidator: AuthorizationRequestValidator,
    private readonly mcpTokenService: McpTokenService,
    private readonly mcpTokenIssuer: McpTokenIssuer,
    private readonly mcpTokenRepository: McpTokenRepository,
    private readonly mcpGrantRepository: McpGrantRepository,
    private readonly accountRepository: AccountRepository,
  ) {}

  async execute({
    refreshToken,
    clientId,
    resource,
  }: RefreshMcpTokenUseCase.Input): Promise<RefreshMcpTokenUseCase.Output> {
    this.oauthClientService.verify(clientId);
    this.authorizationRequestValidator.assertResource(resource);

    const invalidGrant = () => new OAuthError('invalid_grant', 'The refresh token is invalid or expired.');

    if (!refreshToken.startsWith(MCP_REFRESH_TOKEN_PREFIX)) {
      throw invalidGrant();
    }

    const token = await this.mcpTokenRepository.findByHash(this.mcpTokenService.hashToken(refreshToken));

    if (!token || token.kind !== 'refresh') {
      throw invalidGrant();
    }

    const grant = await this.mcpGrantRepository.findById(token.accountId, token.grantId);

    if (!grant || grant.revokedAt || grant.clientId !== clientId) {
      throw invalidGrant();
    }

    if (token.expiresAt * 1000 <= Date.now()) {
      throw invalidGrant();
    }

    const account = await this.accountRepository.findById(token.accountId);

    if (!account) {
      await this.mcpGrantRepository.revoke(token.accountId, token.grantId);
      throw invalidGrant();
    }

    const firstUse = await this.mcpTokenRepository.markUsed(token.accountId, token.id);

    if (!firstUse) {
      // A rotated refresh token came back: assume it leaked and cut the whole connection.
      await this.mcpGrantRepository.revoke(token.accountId, token.grantId);
      throw invalidGrant();
    }

    const tokens = await this.mcpTokenIssuer.issue({
      accountId: token.accountId,
      grantId: token.grantId,
    });

    await this.mcpGrantRepository.touch(token.accountId, token.grantId);

    return tokens;
  }
}

export namespace RefreshMcpTokenUseCase {
  export type Input = {
    refreshToken: string;
    clientId: string;
    resource?: string;
  };

  export type Output = McpTokenIssuer.Output;
}
