import 'reflect-metadata';

import { ExportPublishedFormDataController } from '@application/controllers/portal/ExportPublishedFormDataController';
import { Registry } from '@kernel/di/Registry';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

const controller = Registry.getInstance().resolve(ExportPublishedFormDataController);

export const handler = lambdaHttpAdapter(controller);
