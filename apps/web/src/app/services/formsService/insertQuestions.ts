import { QuestionType } from '@monorepo/shared/enums/QuestionType';

import { httpClient } from '../httpClient';

export type InsertQuestionsRequest = {
  id: string;
  questions: {
    id?: string;
    text: string;
    questionType: QuestionType;
    order: number;
    options?: string[] | undefined;
  }[];
}

export async function insertQuestions({ id, ...params }: InsertQuestionsRequest) {
  await httpClient.post(
    `/forms/${id}/questions`,
    params,
  );
}
