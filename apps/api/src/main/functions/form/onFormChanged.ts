import 'reflect-metadata';

import { Registry } from '@kernel/di/Registry';
import { OnFormChangedController } from '@application/controllers/streams/OnFormChangedController';
import { lambdaDynamoAdapter } from '@main/adapters/lambdaDynamoAdapter';

const controller = Registry.getInstance().resolve(OnFormChangedController);

export const handler = lambdaDynamoAdapter(controller);
