import { Controller } from '@application/contracts/Controller';

import { OAuthError, OAuthErrorBody } from './OAuthError';

export const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
  Pragma: 'no-cache',
};

/** Runs `handler`, converting a thrown `OAuthError` into an RFC 6749 error response. */
export async function withOAuthErrors<TBody>(
  handler: () => Promise<Controller.Response<TBody>>,
): Promise<Controller.Response<TBody | OAuthErrorBody>> {
  try {
    return await handler();
  } catch (error) {
    if (!(error instanceof OAuthError)) {
      throw error;
    }

    return {
      statusCode: error.statusCode,
      headers: NO_STORE_HEADERS,
      body: {
        error: error.error,
        ...(error.description ? { error_description: error.description } : {}),
      },
    };
  }
}
