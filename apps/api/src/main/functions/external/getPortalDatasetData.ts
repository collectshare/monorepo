import 'reflect-metadata';

import { ExternalGetPublishedFormDataController } from '@application/controllers/external/ExternalGetPublishedFormDataController';
import { Registry } from '@kernel/di/Registry';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

const controller = Registry.getInstance().resolve(ExternalGetPublishedFormDataController);

export const handler = lambdaHttpAdapter(controller);
