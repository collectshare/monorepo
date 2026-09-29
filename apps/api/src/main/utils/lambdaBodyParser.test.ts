import { describe, expect, it } from 'vitest';

import { BadRequest } from '@application/errors/http/BadRequest';

import { lambdaBodyParser } from './lambdaBodyParser';

describe('lambdaBodyParser', () => {
  it('returns an empty object for a missing body', () => {
    expect(lambdaBodyParser(undefined)).toEqual({});
  });

  it('parses JSON bodies by default', () => {
    expect(lambdaBodyParser('{"a":1}')).toEqual({ a: 1 });
  });

  it('parses application/x-www-form-urlencoded bodies', () => {
    const body = 'grant_type=authorization_code&code=abc&redirect_uri=https%3A%2F%2Fclaude.ai%2Fcb';

    expect(lambdaBodyParser(body, { contentType: 'application/x-www-form-urlencoded' })).toEqual({
      grant_type: 'authorization_code',
      code: 'abc',
      redirect_uri: 'https://claude.ai/cb',
    });
  });

  it('accepts a content type with a charset suffix', () => {
    expect(
      lambdaBodyParser('a=1', { contentType: 'application/x-www-form-urlencoded; charset=UTF-8' }),
    ).toEqual({ a: '1' });
  });

  it('decodes base64 encoded bodies', () => {
    const encoded = Buffer.from('a=1&b=2').toString('base64');

    expect(
      lambdaBodyParser(encoded, { contentType: 'application/x-www-form-urlencoded', isBase64Encoded: true }),
    ).toEqual({ a: '1', b: '2' });

    expect(
      lambdaBodyParser(Buffer.from('{"a":1}').toString('base64'), { isBase64Encoded: true }),
    ).toEqual({ a: 1 });
  });

  it('throws BadRequest for malformed JSON', () => {
    expect(() => lambdaBodyParser('{oops')).toThrow(BadRequest);
  });
});
