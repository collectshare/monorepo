import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import { AnswerRepository } from '@infra/database/dynamo/repositories/AnswerRepository';
import { FormSubmissionRepository } from '@infra/database/dynamo/repositories/FormSubmissionRepository';
import { QuestionRepository } from '@infra/database/dynamo/repositories/QuestionRepository';
import { Injectable } from '@kernel/decorators/Injectable';

@Injectable()
export class GetPublishedFormDataQuery {
  constructor(
    private readonly submissionRepository: FormSubmissionRepository,
    private readonly answerRepository: AnswerRepository,
    private readonly questionRepository: QuestionRepository,
  ) { }

  async execute({
    formId,
    limit,
    cursor,
  }: GetPublishedFormDataQuery.Input): Promise<GetPublishedFormDataQuery.Output> {
    const [{ submissions, nextCursor }, questions] = await Promise.all([
      this.submissionRepository.findByFormIdPaginated(formId, { limit, cursor }),
      this.questionRepository.findByFormId(formId),
    ]);

    const fileQuestionIds = new Set(
      questions.filter(question => question.questionType === QuestionType.FILE).map(question => question.id),
    );

    const rows = await Promise.all(
      submissions.map(async (submission) => {
        const answers = await this.answerRepository.findBySubmissionId(submission.id);

        return {
          submissionId: submission.id,
          submittedAt: submission.submittedAt,
          answers: answers
            .filter(answer => !fileQuestionIds.has(answer.questionId))
            .map(answer => ({
              questionId: answer.questionId,
              value: answer.value,
            })),
        };
      }),
    );

    return { rows, nextCursor };
  }
}

export namespace GetPublishedFormDataQuery {
  export type Input = {
    formId: string;
    limit: number;
    cursor?: string;
  };

  export type Row = {
    submissionId: string;
    submittedAt: Date;
    answers: Array<{
      questionId: string;
      value: string | string[];
    }>;
  };

  export type Output = {
    rows: Row[];
    nextCursor?: string;
  };
}
