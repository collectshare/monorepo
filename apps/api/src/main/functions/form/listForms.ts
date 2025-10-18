import 'reflect-metadata';

import { ListFormsController } from '@application/controllers/form/ListFormsController';
import { Registry } from '@kernel/di/Registry';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

const controller = Registry.getInstance().resolve(ListFormsController);

export const handler = lambdaHttpAdapter(controller);
