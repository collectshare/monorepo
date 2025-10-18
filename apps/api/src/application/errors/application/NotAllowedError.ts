import { ErrorCode } from '../ErrorCode';
import { ApplicationError } from './ApplicationError';

export class NotAllowedError extends ApplicationError {
  public override statusCode = 405;

  public override code: ErrorCode;

  constructor() {
    super();

    this.name = 'NotAllowedError';
    this.message = 'You are not allowed to perform this action.';
    this.code = ErrorCode.NOT_ALLOWED;
  }
}
