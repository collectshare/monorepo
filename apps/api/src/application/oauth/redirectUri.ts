const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/** Redirect URIs every deployment accepts (MCP hosts' fixed OAuth callbacks). */
export const BUILT_IN_REDIRECT_URIS = [
  'https://claude.ai/api/mcp/auth_callback',
  'https://claude.com/api/mcp/auth_callback',
];

function parse(uri: string): URL | null {
  try {
    return new URL(uri);
  } catch {
    return null;
  }
}

/** `http` on a loopback host (RFC 8252 §7.3): the port is chosen by the client at runtime. */
export function isLoopbackRedirectUri(uri: string): boolean {
  const url = parse(uri);

  return !!url && url.protocol === 'http:' && LOOPBACK_HOSTS.has(url.hostname);
}

/**
 * A redirect URI may be registered when it is in the allow-list (exact match) or is an
 * `http` loopback URI. Fragments and embedded credentials are never allowed.
 */
export function isRedirectUriAllowed(uri: string, allowList: string[]): boolean {
  const url = parse(uri);

  if (!url || url.hash || url.username || url.password) {
    return false;
  }

  if (isLoopbackRedirectUri(uri)) {
    return true;
  }

  return allowList.includes(uri);
}

/**
 * The redirect URI of an authorization request must equal a registered one. For loopback
 * URIs only the port may differ.
 */
export function redirectUriMatches(registered: string[], requested: string): boolean {
  if (registered.includes(requested)) {
    return true;
  }

  const requestedUrl = parse(requested);

  if (!requestedUrl || !isLoopbackRedirectUri(requested)) {
    return false;
  }

  return registered.some((candidate) => {
    const candidateUrl = parse(candidate);

    return (
      !!candidateUrl
      && isLoopbackRedirectUri(candidate)
      && candidateUrl.hostname === requestedUrl.hostname
      && candidateUrl.pathname === requestedUrl.pathname
      && candidateUrl.search === requestedUrl.search
    );
  });
}
