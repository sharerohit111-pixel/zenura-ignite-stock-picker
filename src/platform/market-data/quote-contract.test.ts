import { describe, expect, it } from 'vitest';
import { isQuoteDisplayable, validateEquityQuote, type EquityQuote } from './quote-contract';

const baseQuote: EquityQuote = {
  exchange: 'NSE',
  symbol: 'INFY',
  currency: 'INR',
  lastPrice: 1500,
  change: 10,
  changePercent: 0.67,
  volume: 100000,
  quoteTime: '2026-11-17T10:00:00.000Z',
  retrievedAt: '2026-11-17T10:00:02.000Z',
  sourceId: 'licensed-provider',
  status: 'VERIFIED',
  validationIssues: [],
};

describe('market quote validation', () => {
  it('accepts a fresh quote from an approved source', () => {
    expect(isQuoteDisplayable(baseQuote, '2026-11-17T10:00:30.000Z', new Set(['licensed-provider']))).toBe(true);
  });

  it('rejects quotes from unapproved sources', () => {
    expect(validateEquityQuote(baseQuote, '2026-11-17T10:00:30.000Z', new Set())).toContain('Market-data source is not approved');
  });

  it('rejects stale quotes rather than displaying them as live', () => {
    expect(validateEquityQuote(baseQuote, '2026-11-17T10:03:00.000Z', new Set(['licensed-provider']))).toContain('Quote is stale');
  });

  it('rejects invalid prices and negative volume', () => {
    const invalid = { ...baseQuote, lastPrice: 0, volume: -1 };
    const issues = validateEquityQuote(invalid, '2026-11-17T10:00:30.000Z', new Set(['licensed-provider']));
    expect(issues).toContain('lastPrice is invalid');
    expect(issues).toContain('volume is invalid');
  });

  it('rejects unverified provider responses and missing prices', () => {
    const unverified = { ...baseQuote, status: 'UNVERIFIED' as const, lastPrice: null };
    const issues = validateEquityQuote(unverified, '2026-11-17T10:00:30.000Z', new Set(['licensed-provider']));
    expect(issues).toContain('Provider has not marked the quote as verified');
    expect(issues).toContain('Last traded price is unavailable');
  });

  it('rejects future timestamps outside the permitted clock skew', () => {
    const future = { ...baseQuote, quoteTime: '2026-11-17T10:02:00.000Z' };
    expect(validateEquityQuote(future, '2026-11-17T10:00:00.000Z', new Set(['licensed-provider']))).toContain('Quote timestamp is in the future');
  });
});
