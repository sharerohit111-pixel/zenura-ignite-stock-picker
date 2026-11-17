import type { MetricKey, MetricObservation, PeriodType } from '../../platform/data-contracts/types';
import { METRIC_CATALOG } from '../../platform/data-contracts/metric-catalog';

export type FilterOperator = 'GT' | 'GTE' | 'LT' | 'LTE' | 'EQ' | 'BETWEEN' | 'IS_MISSING';
export interface ScreenerRule {
  metric: MetricKey;
  operator: FilterOperator;
  value?: number;
  upperValue?: number;
  periods?: PeriodType[];
  verifiedOnly?: boolean;
}
export interface ScreenerCompany {
  companyId: string;
  name: string;
  symbol?: string;
  sector?: string;
  identityStatus?: 'CONFIRMED' | 'PROVISIONAL' | 'CONFLICT';
}
export interface ScreenerRow {
  company: ScreenerCompany;
  observations: MetricObservation[];
}
export interface ScreenerOptions {
  rules: ScreenerRule[];
  search?: string;
  sortBy?: MetricKey;
  sortDirection?: 'ASC' | 'DESC';
  includeUnverifiedIdentity?: boolean;
  /** Demo-only: allow clearly-labelled illustrative observations in sort controls. */
  includeUnverifiedValuesForSort?: boolean;
}
export interface ScreenerResult {
  rows: ScreenerRow[];
  matched: number;
  excludedForIdentity: number;
  excludedForData: number;
}

function latestObservation(items: MetricObservation[], rule: ScreenerRule): MetricObservation | undefined {
  return items
    .filter(item => item.metricKey === rule.metric)
    .filter(item => !rule.periods?.length || rule.periods.includes(item.periodType))
    .filter(item => rule.operator === 'IS_MISSING' || !rule.verifiedOnly || item.status === 'VERIFIED')
    .sort((a, b) => (rule.operator === 'IS_MISSING' ? 0 : Number(b.status === 'VERIFIED') - Number(a.status === 'VERIFIED')) ||
      Date.parse(b.periodEnd) - Date.parse(a.periodEnd) ||
      Date.parse(b.sourceRetrievedAt) - Date.parse(a.sourceRetrievedAt))[0];
}

function matches(value: number | null | undefined, rule: ScreenerRule): boolean {
  if (rule.operator === 'IS_MISSING') return value == null;
  if (value == null || !Number.isFinite(value)) return false;
  switch (rule.operator) {
    case 'GT': return rule.value !== undefined && value > rule.value;
    case 'GTE': return rule.value !== undefined && value >= rule.value;
    case 'LT': return rule.value !== undefined && value < rule.value;
    case 'LTE': return rule.value !== undefined && value <= rule.value;
    case 'EQ': return rule.value !== undefined && value === rule.value;
    case 'BETWEEN': return rule.value !== undefined && rule.upperValue !== undefined &&
      rule.value <= rule.upperValue && value >= rule.value && value <= rule.upperValue;
    default: return false;
  }
}

/** Pure, provider-neutral screener. Missing values never become zero; no live data is fetched here. */
export function runScreener(rows: ScreenerRow[], options: ScreenerOptions): ScreenerResult {
  const term = options.search?.trim().toLocaleLowerCase() ?? '';
  let excludedForIdentity = 0;
  const excludedForDataIds = new Set<string>();
  const eligible = rows.filter(row => {
    const identityAllowed = options.includeUnverifiedIdentity ||
      (!row.company.identityStatus || row.company.identityStatus === 'CONFIRMED');
    if (!identityAllowed) excludedForIdentity++;
    return identityAllowed;
  });
  const filtered = eligible.filter(row => {
    const searchable = [row.company.name, row.company.symbol, row.company.sector]
      .filter(Boolean).join(' ').toLocaleLowerCase();
    if (term && !searchable.includes(term)) return false;
    const passes = options.rules.every(rule => {
      const observation = latestObservation(row.observations, rule);
      const ok = matches(observation?.value, rule);
      if (!ok && observation?.value == null) excludedForDataIds.add(row.company.companyId);
      return ok;
    });
    return passes;
  });
  const direction = options.sortDirection === 'ASC' ? 1 : -1;
  if (options.sortBy) {
    filtered.sort((a, b) => {
      const sortRule: ScreenerRule = { metric: options.sortBy!, operator: 'GT', periods: undefined, verifiedOnly: !options.includeUnverifiedValuesForSort };
      const av = latestObservation(a.observations, sortRule)?.value;
      const bv = latestObservation(b.observations, sortRule)?.value;
      if (av == null) return bv == null ? a.company.name.localeCompare(b.company.name) : 1;
      if (bv == null) return -1;
      return (av - bv) * direction;
    });
  } else {
    filtered.sort((a, b) => a.company.name.localeCompare(b.company.name));
  }
  return { rows: filtered, matched: filtered.length, excludedForIdentity, excludedForData: excludedForDataIds.size };
}

export interface SavedScreen {
  id: string;
  name: string;
  rules: ScreenerRule[];
  search: string;
  updatedAt: string;
  sortMetric?: MetricKey | 'NAME';
  sortDirection?: 'ASC' | 'DESC';
}
const STORAGE_KEY = 'zi-saved-screens-v1';
const PERIOD_TYPES: PeriodType[] = ['ANNUAL', 'QUARTERLY', 'TTM', 'INSTANT', 'CUSTOM'];
const FILTER_OPERATORS: FilterOperator[] = ['GT', 'GTE', 'LT', 'LTE', 'EQ', 'BETWEEN', 'IS_MISSING'];
function isSavedScreen(value: unknown): value is SavedScreen {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<SavedScreen>;
  if (typeof item.id !== 'string' || !item.id || typeof item.name !== 'string' ||
      !item.name.trim() || !Array.isArray(item.rules) || typeof item.search !== 'string' ||
      typeof item.updatedAt !== 'string') return false;
  if (item.sortMetric !== undefined && item.sortMetric !== 'NAME' &&
      (typeof item.sortMetric !== 'string' || !Object.prototype.hasOwnProperty.call(METRIC_CATALOG, item.sortMetric))) return false;
  if (item.sortDirection !== undefined && item.sortDirection !== 'ASC' && item.sortDirection !== 'DESC') return false;
  return item.rules.every((candidate: unknown) => {
    if (!candidate || typeof candidate !== 'object') return false;
    const rule = candidate as Partial<ScreenerRule>;
    if (typeof rule.metric !== 'string' || !Object.prototype.hasOwnProperty.call(METRIC_CATALOG, rule.metric) ||
        !FILTER_OPERATORS.includes(rule.operator as FilterOperator)) return false;
    if (rule.value !== undefined && (typeof rule.value !== 'number' || !Number.isFinite(rule.value))) return false;
    if (rule.upperValue !== undefined && (typeof rule.upperValue !== 'number' || !Number.isFinite(rule.upperValue))) return false;
    if (rule.operator === 'IS_MISSING') {
      if (rule.value !== undefined || rule.upperValue !== undefined) return false;
    } else if (rule.operator === 'BETWEEN') {
      if (rule.value === undefined || rule.upperValue === undefined || rule.value > rule.upperValue) return false;
    } else if (rule.value === undefined || rule.upperValue !== undefined) return false;
    if (rule.periods !== undefined && (!Array.isArray(rule.periods) ||
        !rule.periods.every(period => PERIOD_TYPES.includes(period)))) return false;
    return rule.verifiedOnly === undefined || typeof rule.verifiedOnly === 'boolean';
  });
}
export function loadSavedScreens(storage?: Pick<Storage, 'getItem'>): SavedScreen[] {
  try {
    const raw = (storage ?? (typeof localStorage !== 'undefined' ? localStorage : undefined))?.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedScreen);
  } catch { return []; }
}
export function saveScreen(screen: SavedScreen, storage?: Pick<Storage, 'setItem' | 'getItem'>): SavedScreen[] {
  if (!isSavedScreen(screen)) return loadSavedScreens(storage);
  const target = storage ?? (typeof localStorage !== 'undefined' ? localStorage : undefined);
  if (!target) return [screen];
  const next = [...loadSavedScreens(target).filter(item => item.id !== screen.id), screen];
  try { target.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* Private mode/quota: keep app usable. */ }
  return next;
}
export function deleteSavedScreen(id: string, storage?: Pick<Storage, 'setItem' | 'getItem'>): SavedScreen[] {
  const target = storage ?? (typeof localStorage !== 'undefined' ? localStorage : undefined);
  const next = loadSavedScreens(target).filter(item => item.id !== id);
  try { target?.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* Keep in-memory result. */ }
  return next;
}
