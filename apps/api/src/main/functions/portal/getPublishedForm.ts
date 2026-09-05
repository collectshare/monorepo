import 'reflect-metadata';

import { GetPublishedFormController } from '@application/controllers/portal/GetPublishedFormController';
import { Registry } from '@kernel/di/Registry';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

const controller = Registry.getInstance().resolve(GetPublishedFormController);

export const handler = lambdaHttpAdapter(controller);
