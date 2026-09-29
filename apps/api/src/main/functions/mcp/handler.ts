import 'reflect-metadata';

import { McpController } from '@application/controllers/mcp/McpController';
import { McpTokenAuthenticator } from '@application/oauth/McpTokenAuthenticator';
import { Registry } from '@kernel/di/Registry';
import { lambdaMcpAdapter } from '@main/adapters/lambdaMcpAdapter';
import { AppConfig } from '@shared/config/AppConfig';

const registry = Registry.getInstance();

export const handler = lambdaMcpAdapter({
  controller: registry.resolve(McpController),
  authenticator: registry.resolve(McpTokenAuthenticator),
  issuer: registry.resolve(AppConfig).oauth.issuer,
});
