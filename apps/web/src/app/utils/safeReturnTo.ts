/**
 * Accepts only same-origin relative paths ("/foo?bar=1"), so a `returnTo` query param can never
 * turn sign-in into an open redirect. Anything else yields `null`.
 */
export function getSafeReturnTo(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return null;
  }

  try {
    const url = new URL(value, window.location.origin);

    if (url.origin !== window.location.origin) {
      return null;
    }
  } catch {
    return null;
  }

  return value;
}

export function buildSignInPath(returnTo: string): string {
  if (returnTo === '/' || returnTo === '') {
    return '/sign-in';
  }

  return `/sign-in?returnTo=${encodeURIComponent(returnTo)}`;
}
