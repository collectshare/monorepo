import { Controller } from '@application/contracts/Controller';

import { OAuthError } from './OAuthError';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
  Pragma: 'no-cache',
};

export function oauthErrorResponse(error: OAuthError): Controller.Response<{
  error: string;
  error_description?: string;
}> {
  return {
    statusCode: error.statusCode,
    headers: NO_STORE_HEADERS,
    body: {
      error: error.error,
      ...(error.description ? { error_description: error.description } : {}),
    },
  };
}

export function oauthNoStoreHeaders() {
  return { ...NO_STORE_HEADERS };
}

/** Runs `handler`, converting a thrown `OAuthError` into an RFC 6749 error response. */
export async function withOAuthErrors<TBody>(
  handler: () => Promise<Controller.Response<TBody>>,
): Promise<Controller.Response<TBody | { error: string; error_description?: string }>> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof OAuthError) {
      return oauthErrorResponse(error);
    }

    throw error;
  }
}
