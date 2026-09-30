import 'reflect-metadata';

import { OAuthTokenController } from '@application/controllers/oauth/OAuthTokenController';
import { Registry } from '@kernel/di/Registry';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

const controller = Registry.getInstance().resolve(OAuthTokenController);

export const handler = lambdaHttpAdapter(controller);
