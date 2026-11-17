import type { CurrencyCode, ExchangeCode } from '../data-contracts/types';

export type QuoteStatus = 'VERIFIED' | 'STALE' | 'UNVERIFIED' | 'REJECTED';

export interface EquityQuoteRequest {
  exchange: ExchangeCode;
  symbol: string;
}

export interface EquityQuote {
  exchange: ExchangeCode;
  symbol: string;
  currency: CurrencyCode;
  lastPrice: number | null;
  change: number | null;
  changePercent: number | null;
  volume: number | null;
  /** Time assigned by the upstream market-data source. */
  quoteTime: string;
  /** Time the server retrieved this response from the provider. */
  retrievedAt: string;
  sourceId: string;
  status: QuoteStatus;
  validationIssues: string[];
}

export interface MarketDataProvider {
  readonly providerId: string;
  getEquityQuote(request: EquityQuoteRequest): Promise<EquityQuote>;
}

export interface QuoteFreshnessPolicy {
  maxAgeSeconds: number;
  maxFutureSkewSeconds: number;
}

export const DEFAULT_QUOTE_FRESHNESS_POLICY: QuoteFreshnessPolicy = {
  maxAgeSeconds: 120,
  maxFutureSkewSeconds: 30,
};

/**
 * Fail-closed quote validation. A provider response is not considered verified
 * until its identity, timestamps, values and approved source are all acceptable.
 */
export function validateEquityQuote(
  quote: EquityQuote,
  now: string,
  approvedSourceIds: ReadonlySet<string>,
  policy: QuoteFreshnessPolicy = DEFAULT_QUOTE_FRESHNESS_POLICY,
): string[] {
  const issues: string[] = [];
  if (!quote || typeof quote !== 'object') return ['Quote payload must be an object'];
  if (!quote.symbol?.trim()) issues.push('Symbol is missing');
  if (!['NSE', 'BSE', 'OTHER'].includes(quote.exchange)) issues.push('Exchange is invalid');
  if (!quote.sourceId?.trim() || !approvedSourceIds.has(quote.sourceId)) issues.push('Market-data source is not approved');
  if (!quote.currency || !['INR', 'USD', 'OTHER'].includes(quote.currency)) issues.push('Currency is invalid');

  for (const [field, value] of Object.entries({
    lastPrice: quote.lastPrice,
    change: quote.change,
    changePercent: quote.changePercent,
    volume: quote.volume,
  })) {
    if (value !== null && (!Number.isFinite(value) || (field === 'lastPrice' && value <= 0) || (field === 'volume' && value < 0))) {
      issues.push(`${field} is invalid`);
    }
  }
  if (quote.lastPrice === null) issues.push('Last traded price is unavailable');
  const quoteMs = Date.parse(quote.quoteTime);
  const retrievedMs = Date.parse(quote.retrievedAt);
  const nowMs = Date.parse(now);
  if (![quoteMs, retrievedMs, nowMs].every(Number.isFinite)) {
    issues.push('Quote and retrieval timestamps must be valid');
  } else {
    if (retrievedMs < quoteMs - policy.maxFutureSkewSeconds * 1000) issues.push('Retrieval time precedes quote time');
    if (quoteMs - nowMs > policy.maxFutureSkewSeconds * 1000) issues.push('Quote timestamp is in the future');
    if (nowMs - quoteMs > policy.maxAgeSeconds * 1000) issues.push('Quote is stale');
  }
  if (quote.status !== 'VERIFIED') issues.push('Provider has not marked the quote as verified');
  return [...new Set(issues)];
}

export function isQuoteDisplayable(quote: EquityQuote, now: string, approvedSourceIds: ReadonlySet<string>): boolean {
  return validateEquityQuote(quote, now, approvedSourceIds).length === 0;
}
