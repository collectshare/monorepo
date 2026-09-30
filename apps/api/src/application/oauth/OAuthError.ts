export type OAuthErrorCode =
  | 'invalid_request'
  | 'invalid_client'
  | 'invalid_grant'
  | 'invalid_target'
  | 'invalid_redirect_uri'
  | 'invalid_client_metadata'
  | 'unsupported_grant_type';

export type OAuthErrorBody = {
  error: string;
  error_description?: string;
};

/**
 * Error shaped after RFC 6749 §5.2 / RFC 7591 §3.2.2. OAuth controllers turn it into
 * `{ error, error_description }` responses instead of the API's default error envelope.
 */
export class OAuthError extends Error {
  constructor(
    public readonly error: OAuthErrorCode,
    public readonly description?: string,
  ) {
    super(description ?? error);

    this.name = 'OAuthError';
  }

  get statusCode(): number {
    return this.error === 'invalid_client' ? 401 : 400;
  }
}
