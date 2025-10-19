import { Account } from '@monorepo/shared/entities/Account';
import { Profile } from '@monorepo/shared/entities/Profile';
import { Injectable } from '@kernel/decorators/Injectable';
import { AccountRepository } from '../repositories/AccountRepository';
import { ProfileRepository } from '../repositories/ProfileRepository';
import { UnitOfWork } from './UnitOfWork';

@Injectable()
export class SignUpUnitOfWork extends UnitOfWork {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly profileRepository: ProfileRepository,
  ) {
    super();
  }

  async run({ account, profile }: SignUpUnitOfWork.RunParams) {
    this.addPut(this.accountRepository.getPutCommandInput(account));
    this.addPut(this.profileRepository.getPutCommandInput(profile));

    await this.commit();
  }
}

export namespace SignUpUnitOfWork {
  export type RunParams = {
    account: Account;
    profile: Profile;
  }
}
