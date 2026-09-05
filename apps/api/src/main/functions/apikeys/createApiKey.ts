import 'reflect-metadata';

import { CreateApiKeyController } from '@application/controllers/apikeys/CreateApiKeyController';
import { Registry } from '@kernel/di/Registry';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

const controller = Registry.getInstance().resolve(CreateApiKeyController);

export const handler = lambdaHttpAdapter(controller);
