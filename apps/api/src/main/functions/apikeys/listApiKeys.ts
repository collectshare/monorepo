import 'reflect-metadata';

import { ListApiKeysController } from '@application/controllers/apikeys/ListApiKeysController';
import { Registry } from '@kernel/di/Registry';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

const controller = Registry.getInstance().resolve(ListApiKeysController);

export const handler = lambdaHttpAdapter(controller);
