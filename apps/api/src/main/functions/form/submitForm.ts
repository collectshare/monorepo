import 'reflect-metadata';

import { SubmitFormController } from '@application/controllers/form/SubmitFormController';
import { Registry } from '@kernel/di/Registry';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

const controller = Registry.getInstance().resolve(SubmitFormController);

export const handler = lambdaHttpAdapter(controller);
