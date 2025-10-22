import { ErrorCode } from '../ErrorCode';
import { ApplicationError } from './ApplicationError';

export class MissingRequiredAnswersError extends ApplicationError {
  public override code: ErrorCode = ErrorCode.MISSING_REQUIRED_ANSWERS;
  constructor(missingAnswers: string[]) {
    super(
      'The following required questions were not answered: ' + missingAnswers.join(', '),
    );
  }
}
