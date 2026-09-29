import 'reflect-metadata';

import { OAuthProtectedResourceMetadataController } from '@application/controllers/oauth/OAuthProtectedResourceMetadataController';
import { Registry } from '@kernel/di/Registry';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

const controller = Registry.getInstance().resolve(OAuthProtectedResourceMetadataController);

export const handler = lambdaHttpAdapter(controller);
