import { randomUUID } from 'node:crypto';

import { AuthorizationRequestValidator } from '@application/oauth/AuthorizationRequestValidator';
import { McpTokenIssuer } from '@application/oauth/McpTokenIssuer';
import { McpTokenService } from '@application/oauth/McpTokenService';
import { OAuthClientService } from '@application/oauth/OAuthClientService';
import { OAuthError } from '@application/oauth/OAuthError';
import { verifyS256 } from '@application/oauth/pkce';
import { McpGrantRepository } from '@infra/database/dynamo/repositories/McpGrantRepository';
import { OAuthCodeRepository } from '@infra/database/dynamo/repositories/OAuthCodeRepository';
import { Injectable } from '@kernel/decorators/Injectable';

@Injectable()
export class ExchangeAuthorizationCodeUseCase {
  constructor(
    private readonly oauthClientService: OAuthClientService,
    private readonly authorizationRequestValidator: AuthorizationRequestValidator,
    private readonly mcpTokenService: McpTokenService,
    private readonly mcpTokenIssuer: McpTokenIssuer,
    private readonly oauthCodeRepository: OAuthCodeRepository,
    private readonly mcpGrantRepository: McpGrantRepository,
  ) {}

  async execute({
    code,
    clientId,
    redirectUri,
    codeVerifier,
    resource,
  }: ExchangeAuthorizationCodeUseCase.Input): Promise<ExchangeAuthorizationCodeUseCase.Output> {
    const client = this.oauthClientService.verify(clientId);

    // Consume first: any failed attempt burns the code, so it cannot be guessed against.
    const storedCode = await this.oauthCodeRepository.consume(this.mcpTokenService.hashAuthorizationCode(code));

    if (!storedCode || storedCode.expiresAt * 1000 <= Date.now()) {
      throw new OAuthError('invalid_grant', 'The authorization code is invalid or expired.');
    }

    if (storedCode.clientId !== clientId || storedCode.redirectUri !== redirectUri) {
      throw new OAuthError('invalid_grant', 'The authorization code was not issued for this client or redirect_uri.');
    }

    if (!verifyS256(codeVerifier, storedCode.codeChallenge)) {
      throw new OAuthError('invalid_grant', 'code_verifier does not match the code_challenge.');
    }

    this.authorizationRequestValidator.assertResource(resource);

    const grantId = randomUUID();

    await this.mcpGrantRepository.create({
      id: grantId,
      accountId: storedCode.accountId,
      clientId,
      clientName: client.clientName,
      createdAt: new Date().toISOString(),
    });

    return this.mcpTokenIssuer.issue({ accountId: storedCode.accountId, grantId });
  }
}

export namespace ExchangeAuthorizationCodeUseCase {
  export type Input = {
    code: string;
    clientId: string;
    redirectUri: string;
    codeVerifier: string;
    resource?: string;
  };

  export type Output = McpTokenIssuer.Output;
}
