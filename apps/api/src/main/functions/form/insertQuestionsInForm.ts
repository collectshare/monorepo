import 'reflect-metadata';

import { InsertQuestionsInFormController } from '@application/controllers/form/InsertQuestionsInFormController';
import { Registry } from '@kernel/di/Registry';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

const controller = Registry.getInstance().resolve(InsertQuestionsInFormController);

export const handler = lambdaHttpAdapter(controller);
