import { describe, expect, it } from 'vitest';

import { toCsv } from './toCsv';

describe('toCsv', () => {
  it('prefixes cells that would run as spreadsheet formulas', () => {
    const csv = toCsv(['=h'], [['=HYPERLINK("x")', '-1+1', '+cmd', '@SUM(A1)', '\tx', '\rx', 'safe', 'a=b']]);

    expect(csv.split('\r\n')).toEqual([
      '\'=h',
      '"\'=HYPERLINK(""x"")",\'-1+1,\'+cmd,\'@SUM(A1),\'\tx,"\'\rx",safe,a=b',
    ]);
  });

  it('leaves plain numbers, including negatives, unprefixed', () => {
    expect(toCsv(['n'], [['-5', '+1', '-3,5', '1.234,56']])).toBe('n\r\n-5,+1,"-3,5","1.234,56"');
  });
});
