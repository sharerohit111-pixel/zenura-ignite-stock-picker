import type { WatchlistResearch } from './storage';

export const WATCHLIST_BACKUP_FORMAT = 'zenura-ignite-watchlist';
export const WATCHLIST_BACKUP_VERSION = 1;
const MAX_SYMBOLS = 1000;
const MAX_NOTE_LENGTH = 5000;

export interface WatchlistBackup {
  format: typeof WATCHLIST_BACKUP_FORMAT;
  version: typeof WATCHLIST_BACKUP_VERSION;
  exportedAt: string;
  symbols: string[];
  research: Record<string, WatchlistResearch>;
}

export type BackupValidation =
  | { ok: true; backup: WatchlistBackup }
  | { ok: false; reason: 'INVALID_JSON' | 'INVALID_FORMAT' | 'UNSUPPORTED_VERSION' | 'INVALID_DATA'; message: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export function createWatchlistBackup(
  symbols: readonly string[],
  research: Record<string, WatchlistResearch>,
  now = new Date()
): WatchlistBackup {
  return {
    format: WATCHLIST_BACKUP_FORMAT,
    version: WATCHLIST_BACKUP_VERSION,
    exportedAt: now.toISOString(),
    symbols: [...new Set(symbols)].slice(0, MAX_SYMBOLS),
    research: Object.fromEntries(Object.entries(research).slice(0, MAX_SYMBOLS).map(([symbol, item]) => [
      symbol,
      { status: item.status, notes: item.notes.slice(0, MAX_NOTE_LENGTH) }
    ]))
  };
}

export function validateWatchlistBackup(
  input: unknown,
  allowedSymbols: readonly string[]
): BackupValidation {
  if (!isRecord(input) || input.format !== WATCHLIST_BACKUP_FORMAT) {
    return { ok: false, reason: 'INVALID_FORMAT', message: 'This file is not a ZENURA IGNITE watchlist backup.' };
  }
  if (input.version !== WATCHLIST_BACKUP_VERSION) {
    return { ok: false, reason: 'UNSUPPORTED_VERSION', message: 'This backup version is not supported.' };
  }
  if (typeof input.exportedAt !== 'string' || !Number.isFinite(Date.parse(input.exportedAt)) ||
      !Array.isArray(input.symbols) || input.symbols.length > MAX_SYMBOLS || !isRecord(input.research)) {
    return { ok: false, reason: 'INVALID_DATA', message: 'The backup structure is invalid.' };
  }
  const allowed = new Set(allowedSymbols);
  const symbols = input.symbols;
  if (symbols.some(symbol => typeof symbol !== 'string' || !allowed.has(symbol)) ||
      new Set(symbols).size !== symbols.length) {
    return { ok: false, reason: 'INVALID_DATA', message: 'The backup contains unknown or duplicate symbols.' };
  }
  const research: Record<string, WatchlistResearch> = {};
  for (const [symbol, raw] of Object.entries(input.research)) {
    if (!allowed.has(symbol) || !isRecord(raw) ||
        !['To review', 'Researching', 'Completed'].includes(String(raw.status)) ||
        typeof raw.notes !== 'string' || raw.notes.length > MAX_NOTE_LENGTH) {
      return { ok: false, reason: 'INVALID_DATA', message: 'The backup contains invalid research notes or status.' };
    }
    research[symbol] = { status: raw.status as WatchlistResearch['status'], notes: raw.notes };
  }
  return {
    ok: true,
    backup: {
      format: WATCHLIST_BACKUP_FORMAT,
      version: WATCHLIST_BACKUP_VERSION,
      exportedAt: input.exportedAt,
      symbols: [...symbols] as string[],
      research
    }
  };
}

export function parseWatchlistBackup(
  json: string,
  allowedSymbols: readonly string[]
): BackupValidation {
  let parsed: unknown;
  try {
    if (json.length > 1_000_000) {
      return { ok: false, reason: 'INVALID_DATA', message: 'The backup file is too large.' };
    }
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, reason: 'INVALID_JSON', message: 'The backup file is not valid JSON.' };
  }
  return validateWatchlistBackup(parsed, allowedSymbols);
}

export function downloadWatchlistBackup(backup: WatchlistBackup): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'zenura-ignite-watchlist-backup.json';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
