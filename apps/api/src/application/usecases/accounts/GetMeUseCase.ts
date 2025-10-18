import { ResourceNotFound } from '@application/errors/application/ResourceNotFound';
import { AccountRepository } from '@infra/database/dynamo/repositories/AccountRepository';
import { ProfileRepository } from '@infra/database/dynamo/repositories/ProfileRepository';
import { Injectable } from '@kernel/decorators/Injectable';

@Injectable()
export class GetMeUseCase {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly profileRepository: ProfileRepository,
  ) {}

  async execute({ accountId }: GetMeUseCase.Input): Promise<GetMeUseCase.Output> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new ResourceNotFound();
    }

    const profile = await this.profileRepository.findByAccountId(accountId);
    if (!profile) {
      throw new ResourceNotFound();
    }

    return {
      id: profile.accountId,
      name: profile.name,
      email: account.email,
    };
  }
}

export namespace GetMeUseCase {
  export type Input = {
    accountId: string;
  };

  export type Output = {
    id: string;
    name: string;
    email: string;
  };
}
