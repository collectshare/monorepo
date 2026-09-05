import { Form } from '@monorepo/shared/entities/Form';
import { Question } from '@monorepo/shared/entities/Question';
import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import { ResourceNotFound } from '@application/errors/application/ResourceNotFound';
import { FormRepository } from '@infra/database/dynamo/repositories/FormRepository';
import { QuestionRepository } from '@infra/database/dynamo/repositories/QuestionRepository';
import { Injectable } from '@kernel/decorators/Injectable';

@Injectable()
export class GetPublishedFormQuery {
  constructor(
    private readonly formRepository: FormRepository,
    private readonly questionRepository: QuestionRepository,
  ) { }

  async execute(formId: string): Promise<GetPublishedFormQuery.Output> {
    const form = await this.formRepository.findById(formId);

    if (!form || !form.isPublished) {
      throw new ResourceNotFound('Dataset not found');
    }

    const questions = await this.questionRepository.findByFormId(formId);

    return {
      form,
      questions: questions.filter(question => question.questionType !== QuestionType.FILE),
    };
  }
}

export namespace GetPublishedFormQuery {
  export type Output = {
    form: Form;
    questions: Question[];
  };
}
