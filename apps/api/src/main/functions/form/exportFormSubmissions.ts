import 'reflect-metadata';

import { ExportFormSubmissionsController } from '@application/controllers/form/ExportFormSubmissionsController';
import { Registry } from '@kernel/di/Registry';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

const controller = Registry.getInstance().resolve(ExportFormSubmissionsController);

export const handler = lambdaHttpAdapter(controller);
