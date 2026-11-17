import { describe, expect, it } from 'vitest';
import { createPaperPortfolio, placePaperOrder } from './engine';
import { removePaperTrade } from './ledger';

const order=(portfolio:ReturnType<typeof createPaperPortfolio>,id:string,side:'BUY'|'SELL',quantity:number,price:number)=>{
  if (!portfolio) throw new Error('Missing test portfolio');
  const result=placePaperOrder(portfolio,{id,symbol:'TCS',side,quantity,price,executedAt:'2026-11-17T10:00:00Z'});
  if (!result.ok) throw new Error(result.message);
  return result.portfolio;
};

const reasonOf=(result:ReturnType<typeof removePaperTrade>)=>result.ok?'OK':result.reason;

describe('validated paper trade removal',()=>{
  it('removes a trade and rebuilds cash and positions',()=>{
    let p=createPaperPortfolio(10000);
    p=order(p,'b1','BUY',10,100);
    p=order(p,'b2','BUY',10,120);
    p=order(p,'s1','SELL',5,130);
    const result=removePaperTrade(p!,'b2');
    expect(result.ok).toBe(true);
    if(result.ok){
      expect(result.portfolio.trades.map(t=>t.id)).toEqual(['b1','s1']);
      expect(result.portfolio.positions.TCS.quantity).toBe(5);
      expect(result.portfolio.positions.TCS.averageCost).toBe(100);
      expect(result.portfolio.cash).toBe(9650);
    }
  });
  it('rejects removal when it would make a later sell impossible',()=>{
    let p=createPaperPortfolio(10000);
    p=order(p,'b1','BUY',5,100);
    p=order(p,'b2','BUY',5,100);
    p=order(p,'s1','SELL',8,110);
    const result=removePaperTrade(p!,'b1');
    expect(result).toMatchObject({ok:false,reason:'INVALID_LEDGER'});
    expect(p!.trades).toHaveLength(3);
  });
  it('rejects duplicate IDs and corrupted snapshot without mutation',()=>{
    let p=createPaperPortfolio(10000);
    p=order(p,'same','BUY',2,100);
    const duplicate={...p!,trades:[...p!.trades,{...p!.trades[0]}]};
    expect(reasonOf(removePaperTrade(duplicate,'same'))).toBe('DUPLICATE_TRADE_ID');
    expect(reasonOf(removePaperTrade({...p!,cash:1},'same'))).toBe('INVALID_LEDGER');
  });
  it('reports missing trade IDs',()=>{
    const p=createPaperPortfolio(1000)!;
    expect(removePaperTrade(p,'missing')).toMatchObject({ok:false,reason:'TRADE_NOT_FOUND'});
  });
});
