import { describe, expect, it } from 'vitest';
import { createWatchlistBackup, parseWatchlistBackup, validateWatchlistBackup } from './backup';

const allowed = ['TCS', 'INFY'];
const valid = () => createWatchlistBackup(
  ['TCS'],
  { TCS: { status: 'Researching', notes: 'Review margins' } },
  new Date('2026-11-17T10:00:00.000Z')
);

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
    expect(parseWatchlistBackup('{', allowed).reason).toBe('INVALID_JSON');
    expect(validateWatchlistBackup({ ...valid(), format: 'other' }, allowed).reason).toBe('INVALID_FORMAT');
    expect(validateWatchlistBackup({ ...valid(), version: 99 }, allowed).reason).toBe('UNSUPPORTED_VERSION');
  });

  it('rejects unknown and duplicate symbols', () => {
    expect(validateWatchlistBackup({ ...valid(), symbols: ['UNKNOWN'] }, allowed).reason).toBe('INVALID_DATA');
    expect(validateWatchlistBackup({ ...valid(), symbols: ['TCS', 'TCS'] }, allowed).reason).toBe('INVALID_DATA');
  });

  it('rejects malformed research data and oversized files', () => {
    expect(validateWatchlistBackup({
      ...valid(), research: { TCS: { status: 'Done', notes: 'x' } }
    }, allowed).reason).toBe('INVALID_DATA');
    expect(parseWatchlistBackup(' '.repeat(1_000_001), allowed).reason).toBe('INVALID_DATA');
  });
});
