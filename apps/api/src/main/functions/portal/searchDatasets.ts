import 'reflect-metadata';

import { SearchDatasetsController } from '@application/controllers/portal/SearchDatasetsController';
import { Registry } from '@kernel/di/Registry';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

const controller = Registry.getInstance().resolve(SearchDatasetsController);

export const handler = lambdaHttpAdapter(controller);
