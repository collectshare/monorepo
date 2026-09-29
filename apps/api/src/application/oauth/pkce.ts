import { createHash, timingSafeEqual } from 'node:crypto';

const CODE_CHALLENGE_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const CODE_VERIFIER_PATTERN = /^[A-Za-z0-9\-._~]{43,128}$/;

export function isValidCodeChallenge(codeChallenge: string): boolean {
  return CODE_CHALLENGE_PATTERN.test(codeChallenge);
}

export function isValidCodeVerifier(codeVerifier: string): boolean {
  return CODE_VERIFIER_PATTERN.test(codeVerifier);
}

export function computeS256Challenge(codeVerifier: string): string {
  return createHash('sha256').update(codeVerifier).digest('base64url');
}

/** RFC 7636 §4.6 with the `S256` method: BASE64URL(SHA256(verifier)) === challenge. */
export function verifyS256(codeVerifier: string, codeChallenge: string): boolean {
  if (!isValidCodeVerifier(codeVerifier)) {
    return false;
  }

  const expected = Buffer.from(computeS256Challenge(codeVerifier));
  const received = Buffer.from(codeChallenge);

  return expected.length === received.length && timingSafeEqual(expected, received);
}
