import { beforeEach, describe, expect, it, vi } from 'vitest';

const { send } = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock('@infra/clients/dynamoClient', () => ({ dynamoClient: { send } }));

import { UnitOfWork } from './UnitOfWork';

class TestUnitOfWork extends UnitOfWork {
  async run(keys: string[]) {
    for (const key of keys) {
      this.addPut({ TableName: 'test-table', Item: { PK: key, SK: key } });
    }

    await this.commit();
  }
}

const sentKeys = (call: number) =>
  send.mock.calls[call][0].input.TransactItems.map((item: { Put: { Item: { PK: string } } }) => item.Put.Item.PK);

describe('UnitOfWork', () => {
  beforeEach(() => {
    send.mockReset();
  });

  it('sends only the items of the current run when the instance is reused', async () => {
    const uow = new TestUnitOfWork();

    await uow.run(['a', 'b']);
    await uow.run(['c']);

    expect(sentKeys(0)).toEqual(['a', 'b']);
    expect(sentKeys(1)).toEqual(['c']);
  });

  it('stays under the 100-item transaction limit across many runs', async () => {
    const uow = new TestUnitOfWork();
    const elevenKeys = Array.from({ length: 11 }, (_, i) => `k${i}`);

    for (let run = 0; run < 20; run++) {
      await uow.run(elevenKeys);
    }

    for (const [command] of send.mock.calls) {
      expect(command.input.TransactItems).toHaveLength(11);
    }
  });

  it('does not carry items over after a failed commit', async () => {
    const uow = new TestUnitOfWork();
    send.mockRejectedValueOnce(new Error('TransactionCanceledException'));

    await expect(uow.run(['a'])).rejects.toThrow();
    await uow.run(['b']);

    expect(sentKeys(1)).toEqual(['b']);
  });
});
