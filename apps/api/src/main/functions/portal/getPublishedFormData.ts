import 'reflect-metadata';

import { GetPublishedFormDataController } from '@application/controllers/portal/GetPublishedFormDataController';
import { Registry } from '@kernel/di/Registry';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

const controller = Registry.getInstance().resolve(GetPublishedFormDataController);

export const handler = lambdaHttpAdapter(controller);
