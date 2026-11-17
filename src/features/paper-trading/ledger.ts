import { createPaperPortfolio, placePaperOrder, type PaperPortfolio } from './engine';

export type RemovePaperTradeResult =
  | { ok: true; portfolio: PaperPortfolio }
  | { ok: false; reason: 'TRADE_NOT_FOUND' | 'DUPLICATE_TRADE_ID' | 'INVALID_LEDGER'; message: string };

const close = (a:number,b:number) => Math.abs(a-b) <= Math.max(0.000001,Math.abs(b)*1e-9);

/** Rebuilds the ledger after removing one uniquely identified trade.
 * Refuses to edit corrupted snapshots or histories that become impossible after removal.
 */
export function removePaperTrade(current:PaperPortfolio, tradeId:string):RemovePaperTradeResult {
  const matches = current.trades.filter(trade=>trade.id===tradeId).length;
  if (matches===0) return {ok:false,reason:'TRADE_NOT_FOUND',message:'This trade could not be found.'};
  if (matches!==1) return {ok:false,reason:'DUPLICATE_TRADE_ID',message:'Trade IDs are duplicated; history was not changed.'};
  if (!Number.isFinite(current.initialCash) || current.initialCash<=0 ||
      !Number.isFinite(current.cash) || !Array.isArray(current.trades) ||
      !current.positions || typeof current.positions!=='object')
    return {ok:false,reason:'INVALID_LEDGER',message:'The current portfolio is invalid; history was not changed.'};

  let verified=createPaperPortfolio(current.initialCash);
  if (!verified) return {ok:false,reason:'INVALID_LEDGER',message:'The starting balance is invalid.'};
  const ids=new Set<string>();
  for (const trade of current.trades) {
    if (!trade || typeof trade.id!=='string' || ids.has(trade.id))
      return {ok:false,reason:'DUPLICATE_TRADE_ID',message:'Trade IDs are missing or duplicated; history was not changed.'};
    ids.add(trade.id);
    const result=placePaperOrder(verified,{
      id:trade.id,symbol:trade.symbol,side:trade.side,quantity:trade.quantity,
      price:trade.price,executedAt:trade.executedAt
    });
    if (!result.ok || !close(result.trade.grossValue,trade.grossValue))
      return {ok:false,reason:'INVALID_LEDGER',message:'The saved trade history is inconsistent. Nothing was changed.'};
    verified=result.portfolio;
  }
  if (!close(verified.cash,current.cash))
    return {ok:false,reason:'INVALID_LEDGER',message:'Current cash does not match the saved trade history. Nothing was changed.'};
  const currentKeys=Object.keys(current.positions).sort();
  const verifiedKeys=Object.keys(verified.positions).sort();
  if (JSON.stringify(currentKeys)!==JSON.stringify(verifiedKeys))
    return {ok:false,reason:'INVALID_LEDGER',message:'Current holdings do not match the saved trade history. Nothing was changed.'};
  for (const key of verifiedKeys) {
    const actual=current.positions[key];
    const expected=verified.positions[key];
    if (!actual || actual.symbol!==expected.symbol || actual.quantity!==expected.quantity ||
        !Number.isFinite(actual.averageCost) || !close(actual.averageCost,expected.averageCost))
      return {ok:false,reason:'INVALID_LEDGER',message:'Current holdings do not match the saved trade history. Nothing was changed.'};
  }
  let rebuilt=createPaperPortfolio(current.initialCash)!;
  for (const trade of current.trades) {
    if (trade.id===tradeId) continue;
    const result=placePaperOrder(rebuilt,{
      id:trade.id,symbol:trade.symbol,side:trade.side,quantity:trade.quantity,
      price:trade.price,executedAt:trade.executedAt
    });
    if (!result.ok || !close(result.trade.grossValue,trade.grossValue))
      return {ok:false,reason:'INVALID_LEDGER',message:'Removing this trade would leave an impossible or inconsistent history. Nothing was changed.'};
    rebuilt=result.portfolio;
  }
  return {ok:true,portfolio:rebuilt};
}
