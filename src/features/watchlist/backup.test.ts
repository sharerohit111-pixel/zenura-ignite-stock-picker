import { describe, expect, it } from 'vitest';
import { createWatchlistBackup, parseWatchlistBackup, validateWatchlistBackup, type BackupValidation } from './backup';

const allowed = ['TCS', 'INFY'];
const valid = () => createWatchlistBackup(
  ['TCS'],
  { TCS: { status: 'Researching', notes: 'Review margins' } },
  new Date('2026-11-17T10:00:00.000Z')
);
const expectFailure = (result: BackupValidation, reason: string) => {
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.reason).toBe(reason);
};

describe('watchlist JSON backup', () => {
  it('creates a portable versioned backup and parses it', () => {
    const backup = valid();
    const result = parseWatchlistBackup(JSON.stringify(backup), allowed);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.backup.symbols).toEqual(['TCS']);
      expect(result.backup.research.TCS.notes).toBe('Review margins');
    }
  });

  it('rejects invalid JSON, foreign formats and unsupported versions', () => {
    expectFailure(parseWatchlistBackup('{', allowed), 'INVALID_JSON');
    expectFailure(validateWatchlistBackup({ ...valid(), format: 'other' }, allowed), 'INVALID_FORMAT');
    expectFailure(validateWatchlistBackup({ ...valid(), version: 99 }, allowed), 'UNSUPPORTED_VERSION');
  });

  it('rejects unknown and duplicate symbols', () => {
    expectFailure(validateWatchlistBackup({ ...valid(), symbols: ['UNKNOWN'] }, allowed), 'INVALID_DATA');
    expectFailure(validateWatchlistBackup({ ...valid(), symbols: ['TCS', 'TCS'] }, allowed), 'INVALID_DATA');
  });

  it('rejects malformed research data and oversized files', () => {
    expectFailure(validateWatchlistBackup({
      ...valid(), research: { TCS: { status: 'Done', notes: 'x' } }
    }, allowed), 'INVALID_DATA');
    expectFailure(parseWatchlistBackup(' '.repeat(1_000_001), allowed), 'INVALID_DATA');
  });
});
