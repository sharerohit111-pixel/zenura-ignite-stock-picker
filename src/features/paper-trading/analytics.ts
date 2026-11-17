import type { PaperTrade } from './engine';

export interface PaperTradingAnalytics {
  buyTurnover: number;
  sellTurnover: number;
  realizedProfitLoss: number;
  completedTrades: number;
  valid: boolean;
}

/** Replays the paper ledger using the simulator's weighted-average-cost method. */
export function calculatePaperTradingAnalytics(trades: readonly PaperTrade[]): PaperTradingAnalytics {
  const positions = new Map<string, { quantity: number; averageCost: number }>();
  let buyTurnover = 0;
  let sellTurnover = 0;
  let realizedProfitLoss = 0;
  let valid = true;

  for (const trade of trades) {
    if (!trade || !/^[A-Z0-9.-]{1,24}$/.test(trade.symbol) ||
        !Number.isSafeInteger(trade.quantity) || trade.quantity <= 0 ||
        !Number.isFinite(trade.price) || trade.price <= 0 ||
        !Number.isFinite(trade.grossValue) ||
        Math.abs(trade.grossValue - trade.quantity * trade.price) > 0.000001 ||
        (trade.side !== 'BUY' && trade.side !== 'SELL')) {
      valid = false;
      break;
    }
    const current = positions.get(trade.symbol) ?? { quantity: 0, averageCost: 0 };
    if (trade.side === 'BUY') {
      const nextQuantity = current.quantity + trade.quantity;
      const nextCost = ((current.quantity * current.averageCost) + trade.grossValue) / nextQuantity;
      if (!Number.isSafeInteger(nextQuantity) || !Number.isFinite(nextCost)) { valid = false; break; }
      positions.set(trade.symbol, { quantity: nextQuantity, averageCost: nextCost });
      buyTurnover += trade.grossValue;
    } else {
      if (trade.quantity > current.quantity) { valid = false; break; }
      realizedProfitLoss += (trade.price - current.averageCost) * trade.quantity;
      const remaining = current.quantity - trade.quantity;
      if (remaining === 0) positions.delete(trade.symbol);
      else positions.set(trade.symbol, { quantity: remaining, averageCost: current.averageCost });
      sellTurnover += trade.grossValue;
    }
  }

  const totals = [buyTurnover, sellTurnover, realizedProfitLoss];
  if (!totals.every(Number.isFinite)) valid = false;
  return {
    buyTurnover: valid ? buyTurnover : 0,
    sellTurnover: valid ? sellTurnover : 0,
    realizedProfitLoss: valid ? realizedProfitLoss : 0,
    completedTrades: valid ? trades.length : 0,
    valid
  };
}
