import { decideAuthorization } from './decideAuthorization';
import { getAuthorizationRequest } from './getAuthorizationRequest';

export const oauthService = {
  getAuthorizationRequest,
  decideAuthorization,
};
