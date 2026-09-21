import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import { GeneralizationConfig } from '@monorepo/shared/types/GeneralizationConfig';

import { httpClient } from '../httpClient';

export type InsertQuestionsRequest = {
  id: string;
  questions: {
    id?: string;
    text: string;
    questionType: QuestionType;
    order: number;
    options?: string[] | undefined;
    max?: number;
    isRequired?: boolean;
    piiStrategy?: 'pseudonymize' | 'generalize' | 'suppress' | null;
    generalizationConfig?: GeneralizationConfig;
  }[];
}

export async function insertQuestions({ id, ...params }: InsertQuestionsRequest) {
  await httpClient.post(
    `/forms/${id}/questions`,
    params,
  );
}
