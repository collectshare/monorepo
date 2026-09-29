import { describe, expect, it } from 'vitest';

import { computeS256Challenge, isValidCodeChallenge, verifyS256 } from './pkce';

// RFC 7636 Appendix B test vector
const VERIFIER = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
const CHALLENGE = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';

describe('pkce', () => {
  it('computes the RFC 7636 S256 challenge', () => {
    expect(computeS256Challenge(VERIFIER)).toBe(CHALLENGE);
  });

  it('verifies a matching verifier', () => {
    expect(verifyS256(VERIFIER, CHALLENGE)).toBe(true);
  });

  it('rejects a wrong verifier', () => {
    expect(verifyS256('a'.repeat(43), CHALLENGE)).toBe(false);
  });

  it('rejects verifiers outside the allowed length or alphabet', () => {
    expect(verifyS256('short', computeS256Challenge('short'))).toBe(false);
    expect(verifyS256(`${'a'.repeat(42)}!`, CHALLENGE)).toBe(false);
  });

  it('validates the challenge format', () => {
    expect(isValidCodeChallenge(CHALLENGE)).toBe(true);
    expect(isValidCodeChallenge('too-short')).toBe(false);
    expect(isValidCodeChallenge(`${CHALLENGE}=`)).toBe(false);
  });
});
