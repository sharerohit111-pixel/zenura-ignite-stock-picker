import { describe, expect, it } from 'vitest';
import { createPaperPortfolio, placePaperOrder } from './engine';
import { createPaperPortfolioBackup, parsePaperPortfolioBackup, validatePaperPortfolioBackup } from './backup';

function sample() {
  let portfolio = createPaperPortfolio(100000)!;
  const buy = placePaperOrder(portfolio,{id:'t1',symbol:'TCS',side:'BUY',quantity:10,price:100,executedAt:'2026-11-17T10:00:00.000Z'});
  if (!buy.ok) throw new Error('fixture buy failed');
  const sell = placePaperOrder(buy.portfolio,{id:'t2',symbol:'TCS',side:'SELL',quantity:2,price:120,executedAt:'2026-11-17T11:00:00.000Z'});
  if (!sell.ok) throw new Error('fixture sell failed');
  return sell.portfolio;
}

function reasonOf(result: ReturnType<typeof validatePaperPortfolioBackup>) {
  if (result.ok) throw new Error('Expected backup validation to fail');
  return result.reason;
}

describe('paper portfolio JSON backup',()=>{
  it('round trips a valid ledger and snapshot',()=>{
    const backup=createPaperPortfolioBackup(sample(),new Date('2026-11-17T12:00:00.000Z'));
    const parsed=parsePaperPortfolioBackup(JSON.stringify(backup));
    expect(parsed.ok).toBe(true);
    if(parsed.ok) {
      expect(parsed.backup.portfolio.cash).toBe(99240);
      expect(parsed.backup.portfolio.positions.TCS.quantity).toBe(8);
      expect(parsed.backup.portfolio.trades).toHaveLength(2);
    }
  });
  it('rejects invalid JSON, wrong format and unsupported versions',()=>{
    expect(reasonOf(parsePaperPortfolioBackup('{'))).toBe('INVALID_JSON');
    expect(reasonOf(validatePaperPortfolioBackup({format:'other'}))).toBe('INVALID_FORMAT');
    expect(reasonOf(validatePaperPortfolioBackup({format:'zenura-ignite-paper-portfolio',version:99}))).toBe('UNSUPPORTED_VERSION');
  });
  it('rejects impossible trades and tampered cash or positions',()=>{
    const backup=createPaperPortfolioBackup(sample());
    const impossible=structuredClone(backup);
    impossible.portfolio.trades[1].quantity=99;
    expect(validatePaperPortfolioBackup(impossible).ok).toBe(false);
    const cash=structuredClone(backup);
    cash.portfolio.cash=1;
    expect(validatePaperPortfolioBackup(cash).ok).toBe(false);
    const holding=structuredClone(backup);
    holding.portfolio.positions.TCS.quantity=999;
    expect(validatePaperPortfolioBackup(holding).ok).toBe(false);
  });
  it('rejects duplicate or blank trade IDs',()=>{
    const backup=createPaperPortfolioBackup(sample());
    const duplicate=structuredClone(backup);
    duplicate.portfolio.trades[1].id=duplicate.portfolio.trades[0].id;
    expect(validatePaperPortfolioBackup(duplicate).ok).toBe(false);
    const blank=structuredClone(backup);
    blank.portfolio.trades[0].id='   ';
    expect(validatePaperPortfolioBackup(blank).ok).toBe(false);
  });
  it('rejects files larger than one megabyte',()=>{
    expect(parsePaperPortfolioBackup(' '.repeat(1_000_001)).ok).toBe(false);
  });
});
