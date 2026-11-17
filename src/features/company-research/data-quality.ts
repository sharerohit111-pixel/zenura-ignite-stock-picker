import type { DataSourceRecord, MetricObservation, PeriodType } from '../../platform/data-contracts/types';

export type FreshnessState = 'FRESH' | 'AGING' | 'STALE' | 'UNKNOWN';
export interface FreshnessPolicy { freshWithinDays: number; agingWithinDays: number; }
export interface ObservationAudit {
  observationId: string;
  freshness: FreshnessState;
  ageDays: number | null;
  provenanceComplete: boolean;
  issues: string[];
}

const DAY_MS = 86_400_000;
const DEFAULT_POLICY: FreshnessPolicy = { freshWithinDays: 7, agingWithinDays: 30 };

/** Freshness is measured from retrieval time, never from the reporting period end. */
export function assessFreshness(
  retrievedAt: string,
  now: string,
  policy: FreshnessPolicy = DEFAULT_POLICY,
): Pick<ObservationAudit, 'freshness' | 'ageDays'> {
  const retrieved = Date.parse(retrievedAt);
  const current = Date.parse(now);
  if (!Number.isFinite(retrieved) || !Number.isFinite(current) || retrieved > current ||
      policy.freshWithinDays < 0 || policy.agingWithinDays < policy.freshWithinDays) {
    return { freshness: 'UNKNOWN', ageDays: null };
  }
  const ageDays = Math.floor((current - retrieved) / DAY_MS);
  if (ageDays <= policy.freshWithinDays) return { freshness: 'FRESH', ageDays };
  if (ageDays <= policy.agingWithinDays) return { freshness: 'AGING', ageDays };
  return { freshness: 'STALE', ageDays };
}

/** Audits source traceability and freshness without changing or repairing source observations. */
export function auditObservation(
  observation: MetricObservation,
  source: DataSourceRecord | undefined,
  now: string,
  policy: FreshnessPolicy = DEFAULT_POLICY,
): ObservationAudit {
  const issues: string[] = [];
  if (!observation.sourceId.trim()) issues.push('Source identifier is missing');
  if (!source) issues.push('Source registry record is missing');
  else {
    if (!source.providerName.trim()) issues.push('Provider name is missing');
    if (!source.dataset.trim()) issues.push('Dataset name is missing');
    if (source.licenceStatus !== 'APPROVED') issues.push('Source licence is not approved');
    if (source.redistributionAllowed === null) issues.push('Redistribution permission is unknown');
    if (source.attributionRequired === null) issues.push('Attribution requirement is unknown');
  }
  if (!observation.periodEnd || !Number.isFinite(Date.parse(observation.periodEnd))) issues.push('Reporting period end is invalid');
  if (!observation.unit) issues.push('Metric unit is missing');
  if (!observation.sourceRetrievedAt || !Number.isFinite(Date.parse(observation.sourceRetrievedAt))) issues.push('Retrieval timestamp is invalid');
  if (observation.value === null || observation.status === 'MISSING') issues.push('Metric value is missing');
  const freshness = assessFreshness(observation.sourceRetrievedAt, now, policy);
  if (freshness.freshness === 'UNKNOWN') issues.push('Freshness cannot be established');
  if (freshness.freshness === 'STALE') issues.push('Source observation is stale');
  return {
    observationId: observation.observationId,
    freshness: freshness.freshness,
    ageDays: freshness.ageDays,
    provenanceComplete: issues.length === 0,
    issues,
  };
}

/** Keep reporting periods explicit in UI labels; TTM is not interchangeable with annual data. */
export function formatPeriodLabel(periodType: PeriodType, periodEnd: string): string {
  const date = new Date(`${periodEnd.slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(date.getTime())) return `${periodType} · period date unavailable`;
  const dateLabel = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
  return `${periodType} · ${dateLabel}`;
}
