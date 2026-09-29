import 'reflect-metadata';

import { OAuthRegisterController } from '@application/controllers/oauth/OAuthRegisterController';
import { Registry } from '@kernel/di/Registry';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

const controller = Registry.getInstance().resolve(OAuthRegisterController);

export const handler = lambdaHttpAdapter(controller);
