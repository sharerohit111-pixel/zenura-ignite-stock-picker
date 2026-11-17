export type PaperSide = 'BUY' | 'SELL';

export interface PaperPosition {
  symbol: string;
  quantity: number;
  averageCost: number;
}

export interface PaperTrade {
  id: string;
  symbol: string;
  side: PaperSide;
  quantity: number;
  price: number;
  grossValue: number;
  executedAt: string;
}

export interface PaperPortfolio {
  initialCash: number;
  cash: number;
  positions: Record<string, PaperPosition>;
  trades: PaperTrade[];
}

export type PaperOrderResult =
  | { ok: true; portfolio: PaperPortfolio; trade: PaperTrade }
  | { ok: false; reason: 'INVALID_ORDER' | 'INSUFFICIENT_CASH' | 'INSUFFICIENT_SHARES'; message: string };

export interface PaperPositionValue extends PaperPosition {
  marketPrice: number | null;
  marketValue: number | null;
  unrealizedProfitLoss: number | null;
}

export interface PaperPortfolioValuation {
  cash: number;
  positions: PaperPositionValue[];
  investedValue: number | null;
  totalEquity: number | null;
  unrealizedProfitLoss: number | null;
  fullyPriced: boolean;
}

/** Create an isolated paper portfolio. No broker, exchange or live quote connection exists. */
export function createPaperPortfolio(initialCash: number): PaperPortfolio | null {
  if (!Number.isFinite(initialCash) || initialCash <= 0) return null;
  return { initialCash, cash: initialCash, positions: {}, trades: [] };
}

/** Execute against the user-entered reference price only; no real order is sent. */
export function placePaperOrder(
  current: PaperPortfolio,
  input: { symbol: string; side: PaperSide; quantity: number; price: number; executedAt?: string; id?: string }
): PaperOrderResult {
  const symbol = input.symbol.trim().toUpperCase();
  const executedAt = input.executedAt ?? new Date().toISOString();
  if (!/^[A-Z0-9.-]{1,24}$/.test(symbol) ||
      (input.side !== 'BUY' && input.side !== 'SELL') ||
      !Number.isSafeInteger(input.quantity) || input.quantity <= 0 ||
      !Number.isFinite(input.price) || input.price <= 0 ||
      !Number.isFinite(Date.parse(executedAt))) {
    return { ok: false, reason: 'INVALID_ORDER', message: 'Enter a valid symbol, whole-share quantity, positive reference price and execution date.' };
  }
  const grossValue = input.quantity * input.price;
  if (!Number.isFinite(grossValue) || grossValue <= 0) {
    return { ok: false, reason: 'INVALID_ORDER', message: 'Order value is outside the supported range.' };
  }

  const existing = current.positions[symbol];
  let cash = current.cash;
  const positions = { ...current.positions };
  if (input.side === 'BUY') {
    if (grossValue > cash) {
      return { ok: false, reason: 'INSUFFICIENT_CASH', message: 'Not enough virtual cash for this paper order.' };
    }
    const oldQuantity = existing?.quantity ?? 0;
    const newQuantity = oldQuantity + input.quantity;
    if (!Number.isSafeInteger(newQuantity)) {
      return { ok: false, reason: 'INVALID_ORDER', message: 'Position quantity exceeds the supported range.' };
    }
    const averageCost = ((oldQuantity * (existing?.averageCost ?? 0)) + grossValue) / newQuantity;
    if (!Number.isFinite(averageCost)) {
      return { ok: false, reason: 'INVALID_ORDER', message: 'Could not calculate the position average cost.' };
    }
    positions[symbol] = { symbol, quantity: newQuantity, averageCost };
    cash -= grossValue;
  } else {
    if (!existing || input.quantity > existing.quantity) {
      return { ok: false, reason: 'INSUFFICIENT_SHARES', message: 'You cannot sell more shares than this paper portfolio holds.' };
    }
    const remaining = existing.quantity - input.quantity;
    if (remaining === 0) delete positions[symbol];
    else positions[symbol] = { ...existing, quantity: remaining };
    cash += grossValue;
  }

  if (!Number.isFinite(cash)) {
    return { ok: false, reason: 'INVALID_ORDER', message: 'Order would exceed the supported cash range.' };
  }
  const trade: PaperTrade = {
    id: input.id ?? `paper-${current.trades.length + 1}`,
    symbol,
    side: input.side,
    quantity: input.quantity,
    price: input.price,
    grossValue,
    executedAt
  };
  return {
    ok: true,
    portfolio: { ...current, cash, positions, trades: [...current.trades, trade] },
    trade
  };
}

/** Missing reference prices remain null; they are never silently treated as zero. */
export function valuePaperPortfolio(
  portfolio: PaperPortfolio,
  referencePrices: Readonly<Record<string, number | null | undefined>>
): PaperPortfolioValuation {
  let investedValue = 0;
  let unrealizedProfitLoss = 0;
  let fullyPriced = true;
  const positions = Object.values(portfolio.positions).map(position => {
    const price = referencePrices[position.symbol];
    if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
      fullyPriced = false;
      return { ...position, marketPrice: null, marketValue: null, unrealizedProfitLoss: null };
    }
    const marketValue = position.quantity * price;
    if (!Number.isFinite(marketValue)) {
      fullyPriced = false;
      return { ...position, marketPrice: null, marketValue: null, unrealizedProfitLoss: null };
    }
    investedValue += marketValue;
    const pnl = marketValue - position.quantity * position.averageCost;
    unrealizedProfitLoss += pnl;
    return { ...position, marketPrice: price, marketValue, unrealizedProfitLoss: pnl };
  });
  const totalsValid = fullyPriced && Number.isFinite(investedValue) && Number.isFinite(unrealizedProfitLoss);
  return {
    cash: portfolio.cash,
    positions,
    investedValue: totalsValid ? investedValue : null,
    totalEquity: totalsValid ? portfolio.cash + investedValue : null,
    unrealizedProfitLoss: totalsValid ? unrealizedProfitLoss : null,
    fullyPriced: totalsValid
  };
}
