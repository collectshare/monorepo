import { httpClient } from '../httpClient';

export type OAuthAuthorizeParams = {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  code_challenge: string;
  code_challenge_method: string;
  state?: string;
  resource?: string;
};

export type GetAuthorizationRequestResponse = {
  clientName: string;
  redirectHost: string;
};

export async function getAuthorizationRequest(
  params: Partial<OAuthAuthorizeParams>,
): Promise<GetAuthorizationRequestResponse> {
  const { data } = await httpClient.get<GetAuthorizationRequestResponse>('/oauth/authorize', { params });

  return data;
}
