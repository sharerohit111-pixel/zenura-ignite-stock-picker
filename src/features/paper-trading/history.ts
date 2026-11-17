import type { PaperTrade } from './engine';

export interface PaperTradeDateRange {
  from?: string;
  to?: string;
}

/** Filters by the user's local calendar dates; end date is inclusive. */
export function filterPaperTradesByDate(trades:readonly PaperTrade[],range:PaperTradeDateRange):PaperTrade[] {
  const from=range.from ? new Date(range.from+'T00:00:00').getTime() : Number.NEGATIVE_INFINITY;
  const to=range.to ? new Date(range.to+'T23:59:59.999').getTime() : Number.POSITIVE_INFINITY;
  if ((range.from && !Number.isFinite(from)) || (range.to && !Number.isFinite(to)) || from>to) return [];
  return trades.filter(trade=>{
    const time=Date.parse(trade.executedAt);
    return Number.isFinite(time) && time>=from && time<=to;
  });
}
