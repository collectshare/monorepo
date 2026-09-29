import { httpClient } from '../httpClient';
import type { OAuthAuthorizeParams } from './getAuthorizationRequest';

export type OAuthDecision = 'approve' | 'deny';

export type DecideAuthorizationResponse = {
  redirectTo: string;
};

export async function decideAuthorization(
  params: Partial<OAuthAuthorizeParams> & { decision: OAuthDecision },
): Promise<DecideAuthorizationResponse> {
  const { data } = await httpClient.post<DecideAuthorizationResponse>('/oauth/authorize', params);

  return data;
}
