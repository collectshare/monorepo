import { ErrorCode } from '../ErrorCode';
import { ApplicationError } from './ApplicationError';

export class TooManyRequests extends ApplicationError {
  public override statusCode = 429;

  public override code: ErrorCode;

  constructor() {
    super();

    this.name = 'TooManyRequests';
    this.message = 'Too many requests, try again later';
    this.code = ErrorCode.TOO_MANY_REQUESTS;
  }
}
