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
  ): Promise<GetFormSubmissionsQuery.Output> {
    const [submissions, questions] = await Promise.all([
      this.submissionRepository.findByFormId(formId),
      this.questionRepository.findByFormId(formId),
    ]);

    const submissionsWithAnswers = await Promise.all(
      submissions.map(async (submission) => {
        const answers = await this.answerRepository.findBySubmissionId(
          submission.id,
        );
        return {
          submission,
          answers,
        };
      }),
    );

    return {
      submissions: submissionsWithAnswers,
      questions,
    };
  }
}

export namespace GetFormSubmissionsQuery {
  export type Output = {
    submissions: Array<{
      submission: FormSubmission;
      answers: Answer[];
    }>;
    questions: Question[];
  };
}
