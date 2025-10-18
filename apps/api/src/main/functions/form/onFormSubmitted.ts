import 'reflect-metadata';

import { Registry } from '@kernel/di/Registry';
import { OnFormSubmittedController } from '@application/controllers/streams/OnFormSubmittedController';
import { lambdaDynamoAdapter } from '@main/adapters/lambdaDynamoAdapter';

const controller = Registry.getInstance().resolve(OnFormSubmittedController);

export const handler = lambdaDynamoAdapter(controller);
