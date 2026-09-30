import { ZodError } from 'zod';

import { ApplicationError } from './application/ApplicationError';
import { ErrorCode } from './ErrorCode';
import { HttpError } from './http/HttpError';

export type ErrorPayload = {
  statusCode: number;
  code: ErrorCode;
  message: any;
};

/**
 * Classifies anything thrown while handling a request. Shared by every transport
 * (REST adapter, MCP) so they report errors identically. Unexpected errors are only logged.
 */
export function toErrorPayload(error: unknown): ErrorPayload {
  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      code: ErrorCode.VALIDATION,
      message: error.issues.map(issue => ({
        field: issue.path.join('.'),
        error: issue.message,
      })),
    };
  }

  if (error instanceof HttpError) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
    };
  }

  if (error instanceof ApplicationError) {
    return {
      statusCode: error.statusCode ?? 400,
      code: error.code,
      message: error.message,
    };
  }

  // eslint-disable-next-line no-console
  console.log(error);

  return {
    statusCode: 500,
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    message: 'Internal server error.',
  };
}
