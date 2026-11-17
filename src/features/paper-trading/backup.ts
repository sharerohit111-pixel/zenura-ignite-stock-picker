import { createPaperPortfolio, placePaperOrder, type PaperPortfolio } from './engine';

export const PAPER_BACKUP_FORMAT = 'zenura-ignite-paper-portfolio';
export const PAPER_BACKUP_VERSION = 1;
const MAX_FILE_SIZE = 1_000_000;
const MAX_TRADES = 20_000;

export interface PaperPortfolioBackup {
  format: typeof PAPER_BACKUP_FORMAT;
  version: typeof PAPER_BACKUP_VERSION;
  exportedAt: string;
  portfolio: PaperPortfolio;
}
export type PaperBackupResult =
  | { ok: true; backup: PaperPortfolioBackup }
  | { ok: false; reason: 'INVALID_JSON' | 'INVALID_FORMAT' | 'UNSUPPORTED_VERSION' | 'INVALID_DATA'; message: string };

const record = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
const close = (a: number, b: number) => Math.abs(a-b) <= Math.max(0.000001, Math.abs(b)*1e-9);

export function createPaperPortfolioBackup(portfolio: PaperPortfolio, now = new Date()): PaperPortfolioBackup {
  return { format: PAPER_BACKUP_FORMAT, version: PAPER_BACKUP_VERSION, exportedAt: now.toISOString(), portfolio };
}

/** Rebuilds every trade from initial cash and compares the supplied snapshot to the ledger result. */
export function validatePaperPortfolioBackup(input: unknown): PaperBackupResult {
  if (!record(input) || input.format !== PAPER_BACKUP_FORMAT)
    return { ok:false, reason:'INVALID_FORMAT', message:'This is not a ZENURA IGNITE paper portfolio backup.' };
  if (input.version !== PAPER_BACKUP_VERSION)
    return { ok:false, reason:'UNSUPPORTED_VERSION', message:'This paper backup version is not supported.' };
  if (typeof input.exportedAt !== 'string' || !Number.isFinite(Date.parse(input.exportedAt)) || !record(input.portfolio))
    return { ok:false, reason:'INVALID_DATA', message:'The backup structure is invalid.' };
  const raw = input.portfolio;
  if (!Number.isFinite(raw.initialCash) || Number(raw.initialCash) <= 0 ||
      !Number.isFinite(raw.cash) || !Array.isArray(raw.trades) || raw.trades.length > MAX_TRADES ||
      !record(raw.positions))
    return { ok:false, reason:'INVALID_DATA', message:'Portfolio values or trade history are invalid.' };
  let rebuilt = createPaperPortfolio(Number(raw.initialCash));
  if (!rebuilt) return { ok:false, reason:'INVALID_DATA', message:'Initial virtual cash is invalid.' };
  const tradeIds = new Set<string>();
  for (const item of raw.trades) {
    if (!record(item) || typeof item.id !== 'string' || item.id.trim().length === 0 ||
        item.id.length > 128 || tradeIds.has(item.id) ||
        typeof item.symbol !== 'string' || typeof item.executedAt !== 'string' ||
        (item.side !== 'BUY' && item.side !== 'SELL') ||
        !Number.isSafeInteger(item.quantity) || Number(item.quantity) <= 0 ||
        !Number.isFinite(item.price) || Number(item.price) <= 0 || !Number.isFinite(item.grossValue))
      return { ok:false, reason:'INVALID_DATA', message:'A trade contains invalid fields.' };
    tradeIds.add(item.id);
    const result = placePaperOrder(rebuilt, {
      id:item.id, symbol:item.symbol, side:item.side, quantity:Number(item.quantity),
      price:Number(item.price), executedAt:item.executedAt
    });
    if (!result.ok || !close(result.trade.grossValue, Number(item.grossValue)))
      return { ok:false, reason:'INVALID_DATA', message:'Trade history is inconsistent or contains an impossible order.' };
    rebuilt = result.portfolio;
  }
  if (!close(rebuilt.cash, Number(raw.cash)))
    return { ok:false, reason:'INVALID_DATA', message:'Cash balance does not match the trade history.' };
  const suppliedKeys = Object.keys(raw.positions).sort();
  const rebuiltKeys = Object.keys(rebuilt.positions).sort();
  if (JSON.stringify(suppliedKeys) !== JSON.stringify(rebuiltKeys))
    return { ok:false, reason:'INVALID_DATA', message:'Holdings do not match the trade history.' };
  for (const key of rebuiltKeys) {
    const p = raw.positions[key];
    const expected = rebuilt.positions[key];
    if (!record(p) || p.symbol !== expected.symbol || p.quantity !== expected.quantity ||
        !Number.isFinite(p.averageCost) || !close(Number(p.averageCost), expected.averageCost))
      return { ok:false, reason:'INVALID_DATA', message:'A holding does not match the trade history.' };
  }
  return { ok:true, backup:{ format:PAPER_BACKUP_FORMAT, version:PAPER_BACKUP_VERSION,
    exportedAt:input.exportedAt, portfolio:rebuilt } };
}

export function parsePaperPortfolioBackup(json: string): PaperBackupResult {
  if (json.length > MAX_FILE_SIZE)
    return { ok:false, reason:'INVALID_DATA', message:'The backup file exceeds the 1 MB limit.' };
  try { return validatePaperPortfolioBackup(JSON.parse(json) as unknown); }
  catch { return { ok:false, reason:'INVALID_JSON', message:'The selected file is not valid JSON.' }; }
}

export function downloadPaperPortfolioBackup(backup: PaperPortfolioBackup): boolean {
  if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof Blob === 'undefined') return false;
  const blob = new Blob([JSON.stringify(backup, null, 2)], {type:'application/json;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `zenura-ignite-paper-portfolio-${new Date().toISOString().slice(0,10)}.json`;
    anchor.click();
    return true;
  } finally { URL.revokeObjectURL(url); }
}
