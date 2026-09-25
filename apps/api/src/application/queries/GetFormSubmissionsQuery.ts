import { Answer } from '@monorepo/shared/entities/Answer';
import { FormSubmission } from '@monorepo/shared/entities/FormSubmission';
import { Question } from '@monorepo/shared/entities/Question';
import { AnswerRepository } from '@infra/database/dynamo/repositories/AnswerRepository';
import { FormSubmissionRepository } from '@infra/database/dynamo/repositories/FormSubmissionRepository';
import { QuestionRepository } from '@infra/database/dynamo/repositories/QuestionRepository';
import { Injectable } from '@kernel/decorators/Injectable';

@Injectable()
export class GetFormSubmissionsQuery {
  constructor(
    private readonly submissionRepository: FormSubmissionRepository,
    private readonly answerRepository: AnswerRepository,
    private readonly questionRepository: QuestionRepository,
  ) { }

  async execute(
    formId: string,
    options?: GetFormSubmissionsQuery.Options,
  ): Promise<GetFormSubmissionsQuery.Output> {
    const [{ submissions, nextCursor }, questions] = await Promise.all([
      options?.limit
        ? this.submissionRepository.findByFormIdPaginated(formId, {
          limit: options.limit,
          cursor: options.cursor,
        })
        : this.submissionRepository.findByFormId(formId).then(page => ({
          submissions: page,
          nextCursor: undefined as string | undefined,
        })),
      this.questionRepository.findByFormId(formId),
    ]);

    const submissionsWithAnswers = await Promise.all(
      submissions.map(async (submission) => {
        const answers = await this.answerRepository.findBySubmissionId(
          submission.id,
        );
        return {
          ...submission,
          answers,
        };
      }),
    );

    return {
      submissions: submissionsWithAnswers,
      questions,
      nextCursor,
    };
  }
}

export namespace GetFormSubmissionsQuery {
  export type Options = {
    limit?: number;
    cursor?: string;
  };

  export type SubmissionWithAnswers = FormSubmission & {
    answers: Answer[];
  };

  export type Output = {
    submissions: SubmissionWithAnswers[];
    questions: Question[];
    nextCursor?: string;
  };
}
