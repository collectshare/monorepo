import { InvalidCredentials } from '@application/errors/application/InvalidCredentials';
import { TooManyRequests } from '@application/errors/application/TooManyRequests';
import { AuthGateway } from '@infra/gateways/AuthGateway';
import { Injectable } from '@kernel/decorators/Injectable';

@Injectable()
export class SignInUseCase {
  constructor(
    private readonly authGateway: AuthGateway,
  ) {}

  async execute({
    email,
    password,
  }: SignInUseCase.Input): Promise<SignInUseCase.Output> {
    try {
      const {
        accessToken,
        refreshToken,
      } = await this.authGateway.signIn({ email, password });

      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      if (isThrottlingError(error)) {
        throw new TooManyRequests();
      }

      throw new InvalidCredentials();
    }
  }
}

// Cognito rate limits and the per-user lockout are not wrong credentials:
// reporting them as 401 makes a throttled login look like a bad password.
function isThrottlingError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === 'TooManyRequestsException' ||
    error.name === 'LimitExceededException' ||
    (error.name === 'NotAuthorizedException' && error.message.includes('Password attempts exceeded'))
  );
}

export namespace SignInUseCase {
  export type Input = {
    email: string;
    password: string;
  };

  export type Output = {
    accessToken: string;
    refreshToken: string;
  };
}
