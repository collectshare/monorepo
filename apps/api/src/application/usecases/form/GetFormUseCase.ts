import { Form } from '@application/entities/Form';
import { Question } from '@application/entities/Question';
import { ResourceNotFound } from '@application/errors/application/ResourceNotFound';
import { FormRepository } from '@infra/database/dynamo/repositories/FormRepository';
import { QuestionRepository } from '@infra/database/dynamo/repositories/QuestionRepository';
import { Injectable } from '@kernel/decorators/Injectable';

@Injectable()
export class GetFormUseCase {
  constructor(
    private readonly formRepository: FormRepository,
    private readonly questionRepository: QuestionRepository,
  ) {}

  async execute({ formId }: GetFormUseCase.Input): Promise<GetFormUseCase.Output> {
    const form = await this.formRepository.findById(formId);

    if (!form) {
      throw new ResourceNotFound();
    }

    const questions = await this.questionRepository.findByFormId(formId);

    return {
      form,
      questions,
    };
  }
}

export namespace GetFormUseCase {
  export type Input = {
    formId: string;
  };

  export type Output = {
    form: Form;
    questions: Question[];
  };
}
