import { FormSubmission } from '@application/entities/FormSubmission';
import { Answer } from '@application/entities/Answer';
import { Injectable } from '@kernel/decorators/Injectable';
import { FormSubmissionRepository } from '../repositories/FormSubmissionRepository';
import { AnswerRepository } from '../repositories/AnswerRepository';
import { UnitOfWork } from './UnitOfWork';

@Injectable()
export class SubmitFormUnitOfWork extends UnitOfWork {
  constructor(
    private readonly submissionRepository: FormSubmissionRepository,
    private readonly answerRepository: AnswerRepository,
  ) {
    super();
  }

  async run({ submission, answers }: SubmitFormUnitOfWork.RunParams) {
    this.addPut(this.submissionRepository.getPutCommandInput(submission));

    for (const answer of answers) {
      this.addPut(this.answerRepository.getPutCommandInput(answer));
    }

    await this.commit();
  }
}

export namespace SubmitFormUnitOfWork {
  export type RunParams = {
    submission: FormSubmission;
    answers: Answer[];
  }
}
