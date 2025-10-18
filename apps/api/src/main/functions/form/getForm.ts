import 'reflect-metadata';

import { GetFormController } from '@application/controllers/form/GetFormController';
import { Registry } from '@kernel/di/Registry';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

const controller = Registry.getInstance().resolve(GetFormController);

export const handler = lambdaHttpAdapter(controller);
