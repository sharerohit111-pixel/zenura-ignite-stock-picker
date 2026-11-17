import { describe, expect, it } from 'vitest';
import { createPaperPortfolio, placePaperOrder } from './engine';
import { createPaperPortfolioBackup, PAPER_BACKUP_FORMAT, PAPER_BACKUP_VERSION } from './backup';
import { loadPaperPortfolio, PAPER_PORTFOLIO_STORAGE_KEY, PAPER_PORTFOLIO_RECOVERY_KEY } from './storage';

function memoryStorage(initial: Record<string,string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key:string) => data.get(key) ?? null,
    setItem: (key:string,value:string) => { data.set(key,value); },
    data
  };
}

describe('paper portfolio local storage recovery',()=>{
  it('loads a valid saved portfolio without creating a recovery copy',()=>{
    let portfolio=createPaperPortfolio(100000)!;
    const buy=placePaperOrder(portfolio,{id:'saved-1',symbol:'TCS',side:'BUY',quantity:2,price:100});
    if(!buy.ok) throw new Error('fixture order failed');
    const storage=memoryStorage({[PAPER_PORTFOLIO_STORAGE_KEY]:JSON.stringify(buy.portfolio)});
    const result=loadPaperPortfolio(storage);
    expect(result.recoveredInvalidData).toBe(false);
    expect(result.portfolio.trades).toHaveLength(1);
    expect(storage.data.has(PAPER_PORTFOLIO_RECOVERY_KEY)).toBe(false);
  });

  it('preserves invalid saved data before returning a fresh portfolio',()=>{
    const raw='{"cash":oops';
    const storage=memoryStorage({[PAPER_PORTFOLIO_STORAGE_KEY]:raw});
    const result=loadPaperPortfolio(storage);
    expect(result.recoveredInvalidData).toBe(true);
    expect(result.recoveryCopySaved).toBe(true);
    expect(storage.data.get(PAPER_PORTFOLIO_RECOVERY_KEY)).toBe(raw);
    expect(result.portfolio.cash).toBe(100000);
    expect(result.portfolio.trades).toHaveLength(0);
  });

  it('never overwrites an existing recovery copy',()=>{
    const previous='older-recovery';
    const storage=memoryStorage({
      [PAPER_PORTFOLIO_STORAGE_KEY]:JSON.stringify({cash:0}),
      [PAPER_PORTFOLIO_RECOVERY_KEY]:previous
    });
    const result=loadPaperPortfolio(storage);
    expect(result.recoveryCopySaved).toBe(false);
    expect(storage.data.get(PAPER_PORTFOLIO_RECOVERY_KEY)).toBe(previous);
  });

  it('does not claim recovery when storage cannot save a copy',()=>{
    const storage={
      getItem:(key:string)=>key===PAPER_PORTFOLIO_STORAGE_KEY?'broken':null,
      setItem:()=>{throw new Error('quota');}
    };
    const result=loadPaperPortfolio(storage);
    expect(result.recoveredInvalidData).toBe(true);
    expect(result.recoveryCopySaved).toBe(false);
  });
});
