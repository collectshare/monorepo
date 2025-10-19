import { Form } from '@monorepo/shared/entities/Form';
import { Question } from '@monorepo/shared/entities/Question';
import { Injectable } from '@kernel/decorators/Injectable';
import { FormRepository } from '../repositories/FormRepository';
import { QuestionRepository } from '../repositories/QuestionRepository';
import { UnitOfWork } from './UnitOfWork';

@Injectable()
export class CreateFormUnitOfWork extends UnitOfWork {
  constructor(
    private readonly formRepository: FormRepository,
    private readonly questionRepository: QuestionRepository,
  ) {
    super();
  }

  async run({ form, questions }: CreateFormUnitOfWork.RunParams) {
    this.addPut(this.formRepository.getPutCommandInput(form));

    for (const question of questions) {
      this.addPut(this.questionRepository.getPutCommandInput(question));
    }

    await this.commit();
  }
}

export namespace CreateFormUnitOfWork {
  export type RunParams = {
    form: Form;
    questions: Question[];
  }
}
