import 'reflect-metadata';

import { UpdateFormDetailsController } from '@application/controllers/form/UpdateFormDetailsController';
import { Registry } from '@kernel/di/Registry';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

const controller = Registry.getInstance().resolve(UpdateFormDetailsController);

export const handler = lambdaHttpAdapter(controller);
