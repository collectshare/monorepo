import 'reflect-metadata';

import { OAuthAuthorizationServerMetadataController } from '@application/controllers/oauth/OAuthAuthorizationServerMetadataController';
import { Registry } from '@kernel/di/Registry';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

const controller = Registry.getInstance().resolve(OAuthAuthorizationServerMetadataController);

export const handler = lambdaHttpAdapter(controller);
