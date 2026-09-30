import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { NotAllowedError } from './application/NotAllowedError';
import { ResourceNotFound } from './application/ResourceNotFound';
import { ErrorCode } from './ErrorCode';
import { BadRequest } from './http/BadRequest';

import { toErrorPayload } from './toErrorPayload';

describe('toErrorPayload', () => {
  it('maps ZodError to a 400 with the failing fields', () => {
    const result = z.object({ title: z.string().min(1) }).safeParse({});
    const error = (result as { error: z.ZodError }).error;

    expect(toErrorPayload(error)).toEqual({
      statusCode: 400,
      code: ErrorCode.VALIDATION,
      message: [{ field: 'title', error: 'Required' }],
    });
  });

  it('maps HttpError using its own status and code', () => {
    expect(toErrorPayload(new BadRequest('Malformed body.'))).toEqual({
      statusCode: 400,
      code: ErrorCode.BAD_REQUEST,
      message: 'Malformed body.',
    });
  });

  it('maps ApplicationError using its status and code', () => {
    expect(toErrorPayload(new ResourceNotFound('Dataset not found'))).toMatchObject({
      code: ErrorCode.RESOURCE_NOT_FOUND,
      message: 'Dataset not found',
    });
    expect(toErrorPayload(new NotAllowedError())).toMatchObject({ code: ErrorCode.NOT_ALLOWED });
  });

  it('hides unexpected errors behind a generic 500 and logs them', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const boom = new Error('secret internals');

    expect(toErrorPayload(boom)).toEqual({
      statusCode: 500,
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Internal server error.',
    });
    expect(log).toHaveBeenCalledWith(boom);

    log.mockRestore();
  });
});
