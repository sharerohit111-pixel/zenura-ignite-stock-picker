export type WatchlistResearchStatus = 'To review' | 'Researching' | 'Completed';
export interface WatchlistResearch { status: WatchlistResearchStatus; notes: string }
export interface WatchlistRepository {
  loadSymbols(allowedSymbols: readonly string[]): string[];
  saveSymbols(symbols: readonly string[]): void;
  loadResearch(allowedSymbols: readonly string[]): Record<string, WatchlistResearch>;
  saveResearch(research: Record<string, WatchlistResearch>, allowedSymbols: readonly string[]): void;
}
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
const SYMBOLS_KEY = 'zi-watchlist';
const RESEARCH_KEY = 'zi-watchlist-research';
const VERSION = 2;
const MAX_SYMBOLS = 1000;
const MAX_NOTE_LENGTH = 5000;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const uniqueAllowed = (values: unknown, allowed: ReadonlySet<string>): string[] => {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter((value): value is string =>
    typeof value === 'string' && allowed.has(value)
  ))].slice(0, MAX_SYMBOLS);
};
const normalizeResearch = (value: unknown, allowed: ReadonlySet<string>): Record<string, WatchlistResearch> => {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([symbol, raw]) => {
    if (!allowed.has(symbol) || !isRecord(raw)) return [];
    const status: WatchlistResearchStatus =
      raw.status === 'Researching' || raw.status === 'Completed' ? raw.status : 'To review';
    const notes = typeof raw.notes === 'string' ? raw.notes.slice(0, MAX_NOTE_LENGTH) : '';
    return [[symbol, { status, notes }]];
  }));
};

/** Local adapter is intentionally device-local; it is not an authenticated cloud store. */
export class LocalWatchlistRepository implements WatchlistRepository {
  constructor(private readonly storage: StorageLike) {}
  loadSymbols(allowedSymbols: readonly string[]): string[] {
    try {
      const parsed: unknown = JSON.parse(this.storage.getItem(SYMBOLS_KEY) || 'null');
      const values = isRecord(parsed) && parsed.version === VERSION ? parsed.items : parsed;
      return uniqueAllowed(values, new Set(allowedSymbols));
    } catch { return []; }
  }
  saveSymbols(symbols: readonly string[]): void {
    try {
      this.storage.setItem(SYMBOLS_KEY, JSON.stringify({
        version: VERSION, items: [...new Set(symbols)].slice(0, MAX_SYMBOLS)
      }));
    } catch { /* Storage may be disabled or full; keep the UI usable. */ }
  }
  loadResearch(allowedSymbols: readonly string[]): Record<string, WatchlistResearch> {
    try {
      const parsed: unknown = JSON.parse(this.storage.getItem(RESEARCH_KEY) || 'null');
      const values = isRecord(parsed) && parsed.version === VERSION ? parsed.items : parsed;
      return normalizeResearch(values, new Set(allowedSymbols));
    } catch { return {}; }
  }
  saveResearch(research: Record<string, WatchlistResearch>, allowedSymbols: readonly string[]): void {
    try {
      const items = normalizeResearch(research, new Set(allowedSymbols));
      this.storage.setItem(RESEARCH_KEY, JSON.stringify({ version: VERSION, items }));
    } catch { /* Storage may be disabled or full; keep the UI usable. */ }
  }
}
export function createLocalWatchlistRepository(): WatchlistRepository | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return new LocalWatchlistRepository(localStorage);
  } catch { return null; }
}
