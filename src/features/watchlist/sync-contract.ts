import type { WatchlistResearch } from './storage';

export interface CloudWatchlistSnapshot {
  /** Opaque server-issued revision/ETag; clients must never manufacture it. */
  revision: string;
  updatedAt: string;
  symbols: string[];
  research: Record<string, WatchlistResearch>;
}
export interface CloudWatchlistPayload {
  symbols: string[];
  research: Record<string, WatchlistResearch>;
}
export type CloudWatchlistSyncResult =
  | { ok: true; snapshot: CloudWatchlistSnapshot }
  | { ok: false; reason: 'UNAUTHENTICATED' | 'FORBIDDEN' | 'CONFLICT' | 'UNAVAILABLE' | 'INVALID_RESPONSE'; message: string; latest?: CloudWatchlistSnapshot };

/**
 * Contract only: implementation belongs on a selected authenticated backend.
 * Server must derive owner identity from the verified session, never request body.
 * Writes use revision preconditions (If-Match/ETag) to prevent silent lost updates.
 */
export interface CloudWatchlistSyncGateway {
  read(): Promise<CloudWatchlistSyncResult>;
  write(payload: CloudWatchlistPayload, expectedRevision: string): Promise<CloudWatchlistSyncResult>;
}

export function validateCloudSnapshot(value: unknown, allowedSymbols: readonly string[]): value is CloudWatchlistSnapshot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  if (typeof item.revision !== 'string' || !item.revision.trim()) return false;
  if (typeof item.updatedAt !== 'string' || !Number.isFinite(Date.parse(item.updatedAt))) return false;
  if (!Array.isArray(item.symbols) || item.symbols.length > 1000) return false;
  const allowed = new Set(allowedSymbols);
  if (item.symbols.some(s => typeof s !== 'string' || !allowed.has(s))) return false;
  if (new Set(item.symbols).size !== item.symbols.length) return false;
  if (!item.research || typeof item.research !== 'object' || Array.isArray(item.research)) return false;
  for (const [symbol, raw] of Object.entries(item.research as Record<string, unknown>)) {
    if (!allowed.has(symbol) || !raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
    const entry = raw as Record<string, unknown>;
    if (!['To review', 'Researching', 'Completed'].includes(String(entry.status))) return false;
    if (typeof entry.notes !== 'string' || entry.notes.length > 5000) return false;
  }
  return true;
}
