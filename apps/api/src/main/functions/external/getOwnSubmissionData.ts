import 'reflect-metadata';

import { ExternalGetOwnFormDataController } from '@application/controllers/external/ExternalGetOwnFormDataController';
import { Registry } from '@kernel/di/Registry';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

const controller = Registry.getInstance().resolve(ExternalGetOwnFormDataController);

export const handler = lambdaHttpAdapter(controller);
