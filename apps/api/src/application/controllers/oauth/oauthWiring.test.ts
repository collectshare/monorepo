import 'reflect-metadata';

import { describe, expect, it } from 'vitest';

import { McpTokenAuthenticator } from '@application/oauth/McpTokenAuthenticator';
import { Registry } from '@kernel/di/Registry';

import { OAuthAuthorizationServerMetadataController } from './OAuthAuthorizationServerMetadataController';
import { OAuthAuthorizeDecisionController } from './OAuthAuthorizeDecisionController';
import { OAuthAuthorizeValidateController } from './OAuthAuthorizeValidateController';
import { OAuthProtectedResourceMetadataController } from './OAuthProtectedResourceMetadataController';
import { OAuthRegisterController } from './OAuthRegisterController';
import { OAuthTokenController } from './OAuthTokenController';

describe('OAuth dependency injection wiring', () => {
  it.each([
    OAuthProtectedResourceMetadataController,
    OAuthAuthorizationServerMetadataController,
    OAuthRegisterController,
    OAuthAuthorizeValidateController,
    OAuthAuthorizeDecisionController,
    OAuthTokenController,
    McpTokenAuthenticator,
  ])('resolves %o through the Registry', (impl) => {
    const instance = Registry.getInstance().resolve(impl);

    expect(instance).toBeInstanceOf(impl);
    // Every constructor dependency must have been injected (needs `design:paramtypes` metadata).
    expect(Object.values(instance as object).every(dependency => dependency !== undefined)).toBe(true);
  });
});
