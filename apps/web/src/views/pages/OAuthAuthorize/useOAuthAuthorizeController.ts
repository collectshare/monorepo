import { useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { oauthService } from '@/app/services/oauthService';
import type { OAuthDecision } from '@/app/services/oauthService/decideAuthorization';
import type { OAuthAuthorizeParams } from '@/app/services/oauthService/getAuthorizationRequest';

const GENERIC_ERROR = 'Não foi possível validar o pedido de autorização.';

/** Clickjacking guard: the consent page must never be rendered inside another site's frame. */
function isRenderedInFrame(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    // Reading window.top across origins throws — that only happens when we are framed.
    return true;
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.error_description ?? GENERIC_ERROR;
  }

  return GENERIC_ERROR;
}

export function useOAuthAuthorizeController() {
  const [searchParams] = useSearchParams();

  const params = useMemo<Partial<OAuthAuthorizeParams>>(() => ({
    client_id: searchParams.get('client_id') ?? undefined,
    redirect_uri: searchParams.get('redirect_uri') ?? undefined,
    response_type: searchParams.get('response_type') ?? undefined,
    code_challenge: searchParams.get('code_challenge') ?? undefined,
    code_challenge_method: searchParams.get('code_challenge_method') ?? undefined,
    state: searchParams.get('state') ?? undefined,
    resource: searchParams.get('resource') ?? undefined,
  }), [searchParams]);

  const isFramed = useMemo(isRenderedInFrame, []);

  const request = useQuery({
    queryKey: ['oauth', 'authorize', params],
    queryFn: () => oauthService.getAuthorizationRequest(params),
    enabled: !isFramed,
    retry: false,
    staleTime: Infinity,
  });

  const decision = useMutation({
    mutationKey: ['oauth', 'decide'],
    mutationFn: async (value: OAuthDecision) => {
      const { redirectTo } = await oauthService.decideAuthorization({ ...params, decision: value });

      // Only ever follow the redirect the server validated against the registered client.
      window.location.assign(redirectTo);
    },
  });

  return {
    isFramed,
    clientName: request.data?.clientName,
    redirectHost: request.data?.redirectHost,
    isLoading: request.isLoading,
    errorMessage: request.isError
      ? getErrorMessage(request.error)
      : decision.isError
        ? getErrorMessage(decision.error)
        : undefined,
    isSubmitting: decision.isPending || decision.isSuccess,
    pendingDecision: decision.variables,
    canDecide: request.isSuccess,
    approve: () => decision.mutate('approve'),
    deny: () => decision.mutate('deny'),
  };
}
