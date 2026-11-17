import { describe, expect, it } from 'vitest';
import { createPaperPortfolio, placePaperOrder, valuePaperPortfolio } from './engine';

describe('paper trading engine', () => {
  it('creates a portfolio only with positive finite starting cash', () => {
    expect(createPaperPortfolio(100000)?.cash).toBe(100000);
    expect(createPaperPortfolio(0)).toBeNull();
    expect(createPaperPortfolio(Number.POSITIVE_INFINITY)).toBeNull();
  });

  it('buys at the entered reference price and updates weighted average cost', () => {
    const start = createPaperPortfolio(10000)!;
    const first = placePaperOrder(start, { symbol: 'tcs', side: 'BUY', quantity: 10, price: 100, executedAt: '2026-11-17T10:00:00Z' });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const second = placePaperOrder(first.portfolio, { symbol: 'TCS', side: 'BUY', quantity: 10, price: 120, executedAt: '2026-11-17T11:00:00Z' });
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.portfolio.cash).toBe(7800);
      expect(second.portfolio.positions.TCS.averageCost).toBe(110);
      expect(second.portfolio.positions.TCS.quantity).toBe(20);
      expect(second.portfolio.trades).toHaveLength(2);
    }
  });

  it('rejects unaffordable buys and sells beyond held quantity without mutation', () => {
    const start = createPaperPortfolio(1000)!;
    const buy = placePaperOrder(start, { symbol: 'INFY', side: 'BUY', quantity: 20, price: 100 });
    expect(buy.ok).toBe(false);
    const sell = placePaperOrder(start, { symbol: 'INFY', side: 'SELL', quantity: 1, price: 100 });
    expect(sell.ok).toBe(false);
    expect(start.cash).toBe(1000);
    expect(start.trades).toHaveLength(0);
  });

  it('sells shares, realizes cash and removes a fully closed position', () => {
    const start = createPaperPortfolio(5000)!;
    const buy = placePaperOrder(start, { symbol: 'ABC', side: 'BUY', quantity: 10, price: 100 });
    if (!buy.ok) throw new Error('Expected buy to pass');
    const sell = placePaperOrder(buy.portfolio, { symbol: 'ABC', side: 'SELL', quantity: 10, price: 125 });
    expect(sell.ok).toBe(true);
    if (sell.ok) {
      expect(sell.portfolio.cash).toBe(5250);
      expect(sell.portfolio.positions.ABC).toBeUndefined();
    }
  });

  it('rejects fractional quantities, bad prices and malformed dates', () => {
    const start = createPaperPortfolio(1000)!;
    expect(placePaperOrder(start, { symbol: 'ABC', side: 'BUY', quantity: 1.5, price: 10 }).ok).toBe(false);
    expect(placePaperOrder(start, { symbol: 'ABC', side: 'BUY', quantity: 1, price: 0 }).ok).toBe(false);
    expect(placePaperOrder(start, { symbol: 'ABC', side: 'BUY', quantity: 1, price: 10, executedAt: 'not-a-date' }).ok).toBe(false);
  });

  it('does not treat missing reference prices as zero', () => {
    const start = createPaperPortfolio(5000)!;
    const buy = placePaperOrder(start, { symbol: 'ABC', side: 'BUY', quantity: 10, price: 100 });
    if (!buy.ok) throw new Error('Expected buy to pass');
    const valuation = valuePaperPortfolio(buy.portfolio, {});
    expect(valuation.fullyPriced).toBe(false);
    expect(valuation.investedValue).toBeNull();
    expect(valuation.totalEquity).toBeNull();
    expect(valuation.positions[0].marketPrice).toBeNull();
  });

  it('values portfolio when every holding has a valid entered reference price', () => {
    const start = createPaperPortfolio(5000)!;
    const buy = placePaperOrder(start, { symbol: 'ABC', side: 'BUY', quantity: 10, price: 100 });
    if (!buy.ok) throw new Error('Expected buy to pass');
    const valuation = valuePaperPortfolio(buy.portfolio, { ABC: 125 });
    expect(valuation.fullyPriced).toBe(true);
    expect(valuation.totalEquity).toBe(5250);
    expect(valuation.unrealizedProfitLoss).toBe(250);
  });
});
