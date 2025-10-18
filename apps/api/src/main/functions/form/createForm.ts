import 'reflect-metadata';

import { CreateFormController } from '@application/controllers/form/CreateFormController';
import { Registry } from '@kernel/di/Registry';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

const controller = Registry.getInstance().resolve(CreateFormController);

export const handler = lambdaHttpAdapter(controller);
