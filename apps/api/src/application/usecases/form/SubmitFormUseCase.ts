import { PutObjectCommand } from '@aws-sdk/client-s3';
import { Answer } from '@monorepo/shared/entities/Answer';
import { FormSubmission } from '@monorepo/shared/entities/FormSubmission';
import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import { AppConfig } from '@shared/config/AppConfig';
import { MissingRequiredAnswersError } from '@application/errors/application/MissingRequiredAnswersError';
import { ResourceNotFound } from '@application/errors/application/ResourceNotFound';
import { s3Client } from '@infra/clients/s3Client';
import { FormRepository } from '@infra/database/dynamo/repositories/FormRepository';
import { QuestionRepository } from '@infra/database/dynamo/repositories/QuestionRepository';
import { SubmitFormUnitOfWork } from '@infra/database/dynamo/uow/SubmitFormUnitOfWork';
import { Injectable } from '@kernel/decorators/Injectable';

@Injectable()
export class SubmitFormUseCase {
  constructor(
    private readonly submitFormUow: SubmitFormUnitOfWork,
    private readonly formRepository: FormRepository,
    private readonly questionRepository: QuestionRepository,
    private readonly appConfig: AppConfig,
  ) { }

  async execute({
    formId,
    answers: answersData,
    ip,
    userAgent,
  }: SubmitFormUseCase.Input): Promise<SubmitFormUseCase.Output> {
    const [form, questions] = await Promise.all([
      this.formRepository.findById(formId),
      this.questionRepository.findByFormId(formId),
    ]);

    if (!form) {
      throw new ResourceNotFound('Form');
    }

    const answeredQuestionIds = new Set(answersData.map(a => a.questionId));
    const missingAnswers: string[] = [];

    for (const question of questions) {
      if (question.isRequired && !answeredQuestionIds.has(question.id)) {
        missingAnswers.push(question.id);
      }
    }

    if (missingAnswers.length > 0) {
      throw new MissingRequiredAnswersError(missingAnswers);
    }

    const submission = new FormSubmission({
      formId,
      ip: form.isAnonymous ? null : ip,
      userAgent: form.isAnonymous ? null : userAgent,
    });

    const answers = await Promise.all(answersData.map(async answerData => {
      const question = questions.find(q => q.id === answerData.questionId);

      if (question?.questionType === QuestionType.FILE && typeof answerData.value === 'object' && 'content' in answerData.value) {
        const file = answerData.value;
        const buffer = Buffer.from(file.content, 'base64');
        const key = `forms/${formId}/submissions/${submission.id}/${question.id}/${file.name}`;

        await s3Client.send(new PutObjectCommand({
          Bucket: this.appConfig.storage.mainBucket,
          Key: key,
          Body: buffer,
          ContentType: file.type,
        }));

        return new Answer({
          ...answerData,
          value: key,
          submissionId: submission.id,
        });
      }

      return new Answer({
        ...answerData,
        value: String(answerData.value),
        submissionId: submission.id,
      });
    }));

    await this.submitFormUow.run({
      submission,
      answers,
    });

    return {
      submissionId: submission.id,
    };
  }
}

export namespace SubmitFormUseCase {
  export type Input = {
    formId: string;
    answers: Array<{
      questionId: string;
      value: string | string[] | number | { name: string; type: string; content: string };
    }>;
    ip: string | null;
    userAgent: string | null;
  };

  export type Output = {
    submissionId: string;
  };
}
