import 'reflect-metadata';

import { RevokeApiKeyController } from '@application/controllers/apikeys/RevokeApiKeyController';
import { Registry } from '@kernel/di/Registry';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

const controller = Registry.getInstance().resolve(RevokeApiKeyController);

export const handler = lambdaHttpAdapter(controller);
