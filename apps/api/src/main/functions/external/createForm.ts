import 'reflect-metadata';

import { ExternalCreateFormController } from '@application/controllers/external/ExternalCreateFormController';
import { Registry } from '@kernel/di/Registry';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

const controller = Registry.getInstance().resolve(ExternalCreateFormController);

export const handler = lambdaHttpAdapter(controller);
