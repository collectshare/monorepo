import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import { AnswerRepository } from '@infra/database/dynamo/repositories/AnswerRepository';
import { FormSubmissionRepository } from '@infra/database/dynamo/repositories/FormSubmissionRepository';
import { QuestionRepository } from '@infra/database/dynamo/repositories/QuestionRepository';
import { AnonymizationEngine } from '@infra/services/AnonymizationEngine';
import { Injectable } from '@kernel/decorators/Injectable';

const MAX_EXPORT_ROWS = 20_000;

@Injectable()
export class ExportPublishedFormDataQuery {
  constructor(
    private readonly submissionRepository: FormSubmissionRepository,
    private readonly answerRepository: AnswerRepository,
    private readonly questionRepository: QuestionRepository,
    private readonly anonymizationEngine: AnonymizationEngine,
  ) { }

  async execute(formId: string): Promise<ExportPublishedFormDataQuery.Output> {
    const [submissions, allQuestions] = await Promise.all([
      this.submissionRepository.findByFormId(formId),
      this.questionRepository.findByFormId(formId),
    ]);

    const questions = allQuestions
      .filter(question => question.questionType !== QuestionType.FILE)
      .sort((a, b) => a.order - b.order);

    const questionById = new Map(questions.map(question => [question.id, question]));

    const cappedSubmissions = submissions
      .sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime())
      .slice(0, MAX_EXPORT_ROWS);

    const rows = await Promise.all(
      cappedSubmissions.map(async (submission) => {
        const answers = await this.answerRepository.findBySubmissionId(submission.id);

        return {
          submissionId: submission.id,
          submittedAt: submission.submittedAt,
          answers: answers
            .filter(answer => questionById.has(answer.questionId))
            .map(answer => {
              const question = questionById.get(answer.questionId);

              return {
                questionId: answer.questionId,
                value: question
                  ? this.anonymizationEngine.resolve(question, answer.value)
                  : answer.value,
              };
            }),
        };
      }),
    );

    return { questions, rows };
  }
}

export namespace ExportPublishedFormDataQuery {
  export type Row = {
    submissionId: string;
    submittedAt: Date;
    answers: Array<{
      questionId: string;
      value: string | string[] | null;
    }>;
  };

  export type Output = {
    questions: Array<{ id: string; text: string }>;
    rows: Row[];
  };
}
