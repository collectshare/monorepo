import 'reflect-metadata';

import { OAuthAuthorizeDecisionController } from '@application/controllers/oauth/OAuthAuthorizeDecisionController';
import { Registry } from '@kernel/di/Registry';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

const controller = Registry.getInstance().resolve(OAuthAuthorizeDecisionController);

export const handler = lambdaHttpAdapter(controller);
