import type { MetricKey, MetricObservation, PeriodType } from '../../platform/data-contracts/types';
export interface ComparisonCompany { companyId: string; name: string; observations: readonly MetricObservation[]; }
export interface ComparisonCell { companyId: string; value: number | null; status: MetricObservation['status'] | 'MISSING' | 'PERIOD_MISMATCH'; periodEnd: string | null; sourceId: string | null; }
export interface ComparisonRow { metric: MetricKey; periodType: PeriodType; cells: ComparisonCell[]; comparable: boolean; }
/** Exact period matching only; unlike periods are never silently aligned. */
export function buildComparison(companies: readonly ComparisonCompany[], metrics: readonly MetricKey[], periodType: PeriodType): ComparisonRow[] {
  return metrics.map(metric => {
    const chosen = companies.map(company => {
      const observation = company.observations.filter(item => item.metricKey === metric && item.periodType === periodType)
        .sort((a,b) => b.periodEnd.localeCompare(a.periodEnd) || b.sourceRetrievedAt.localeCompare(a.sourceRetrievedAt))[0];
      return { companyId: company.companyId, observation };
    });
    const periodEnds = new Set(chosen.map(item => item.observation?.periodEnd).filter((value): value is string => Boolean(value)));
    const commonPeriod = periodEnds.size === 1;
    return {
      metric, periodType,
      comparable: commonPeriod && chosen.every(item => item.observation?.value !== null && item.observation?.status === 'VERIFIED'),
      cells: chosen.map(({companyId,observation}) => ({
        companyId, value: observation?.value ?? null,
        status: !observation ? 'MISSING' : !commonPeriod ? 'PERIOD_MISMATCH' : observation.status,
        periodEnd: observation?.periodEnd ?? null, sourceId: observation?.sourceId ?? null
      }))
    };
  });
}
