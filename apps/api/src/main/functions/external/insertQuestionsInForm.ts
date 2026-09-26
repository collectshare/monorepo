import 'reflect-metadata';

import { ExternalInsertQuestionsInFormController } from '@application/controllers/external/ExternalInsertQuestionsInFormController';
import { Registry } from '@kernel/di/Registry';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

const controller = Registry.getInstance().resolve(ExternalInsertQuestionsInFormController);

export const handler = lambdaHttpAdapter(controller);
