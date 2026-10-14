import { describe, expect, it } from 'vitest';

import { InvalidCredentials } from '@application/errors/application/InvalidCredentials';
import { TooManyRequests } from '@application/errors/application/TooManyRequests';
import type { AuthGateway } from '@infra/gateways/AuthGateway';

import { SignInUseCase } from './SignInUseCase';

const cognitoError = (name: string, message = name) => Object.assign(new Error(message), { name });

const makeUseCase = (error: Error) =>
  new SignInUseCase({ signIn: async () => { throw error; } } as unknown as AuthGateway);

const input = { email: 'a@example.com', password: 'Senha-123!' };

describe('SignInUseCase', () => {
  it.each([
    cognitoError('TooManyRequestsException'),
    cognitoError('LimitExceededException'),
    cognitoError('NotAuthorizedException', 'Password attempts exceeded'),
  ])('reports Cognito throttling ($name) as TooManyRequests', async (error) => {
    await expect(makeUseCase(error).execute(input)).rejects.toBeInstanceOf(TooManyRequests);
  });

  it('reports a wrong password as InvalidCredentials', async () => {
    const error = cognitoError('NotAuthorizedException', 'Incorrect username or password.');

    await expect(makeUseCase(error).execute(input)).rejects.toBeInstanceOf(InvalidCredentials);
  });
});
