import 'reflect-metadata';

import { GetFormSubmissionsController } from '@application/controllers/form/GetFormSubmissionsController';
import { Registry } from '@kernel/di/Registry';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

const controller = Registry.getInstance().resolve(GetFormSubmissionsController);

export const handler = lambdaHttpAdapter(controller);
