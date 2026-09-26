import 'reflect-metadata';

import { ExternalUpdateFormController } from '@application/controllers/external/ExternalUpdateFormController';
import { Registry } from '@kernel/di/Registry';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

const controller = Registry.getInstance().resolve(ExternalUpdateFormController);

export const handler = lambdaHttpAdapter(controller);
