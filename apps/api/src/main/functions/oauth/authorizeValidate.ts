import 'reflect-metadata';

import { OAuthAuthorizeValidateController } from '@application/controllers/oauth/OAuthAuthorizeValidateController';
import { Registry } from '@kernel/di/Registry';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

const controller = Registry.getInstance().resolve(OAuthAuthorizeValidateController);

export const handler = lambdaHttpAdapter(controller);
