import 'reflect-metadata';

import { ExternalSearchDatasetsController } from '@application/controllers/external/ExternalSearchDatasetsController';
import { Registry } from '@kernel/di/Registry';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

const controller = Registry.getInstance().resolve(ExternalSearchDatasetsController);

export const handler = lambdaHttpAdapter(controller);
