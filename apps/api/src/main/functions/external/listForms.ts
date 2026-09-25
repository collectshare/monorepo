import 'reflect-metadata';

import { ExternalListFormsController } from '@application/controllers/external/ExternalListFormsController';
import { Registry } from '@kernel/di/Registry';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

const controller = Registry.getInstance().resolve(ExternalListFormsController);

export const handler = lambdaHttpAdapter(controller);
