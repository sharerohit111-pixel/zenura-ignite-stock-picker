import type { MetricKey, MetricObservation, PeriodType } from '../../platform/data-contracts/types';

export type StatementKind = 'INCOME' | 'BALANCE_SHEET' | 'CASH_FLOW';
export interface StatementLine { key: MetricKey; label: string; unit: string; value: number | null; status: MetricObservation['status'] | 'MISSING'; observationId: string | null; periodEnd: string | null; }
export interface StatementColumn { periodType: PeriodType; periodEnd: string; label: string; lines: StatementLine[]; }

export const STATEMENT_LINES: Record<StatementKind, ReadonlyArray<{ key: MetricKey; label: string; unit: string }>> = {
  INCOME: [
    { key: 'REVENUE', label: 'Revenue', unit: 'Currency' },
    { key: 'OPERATING_PROFIT', label: 'Operating profit', unit: 'Currency' },
    { key: 'EBITDA', label: 'EBITDA', unit: 'Currency' },
    { key: 'INTEREST_EXPENSE', label: 'Interest expense', unit: 'Currency' },
    { key: 'TAX_EXPENSE', label: 'Tax expense', unit: 'Currency' },
    { key: 'PAT', label: 'Profit after tax', unit: 'Currency' },
    { key: 'EPS', label: 'Earnings per share', unit: 'Per share' },
  ],
  BALANCE_SHEET: [
    { key: 'TOTAL_ASSETS', label: 'Total assets', unit: 'Currency' },
    { key: 'CURRENT_ASSETS', label: 'Current assets', unit: 'Currency' },
    { key: 'CASH_AND_EQUIVALENTS', label: 'Cash & equivalents', unit: 'Currency' },
    { key: 'TOTAL_DEBT', label: 'Total debt', unit: 'Currency' },
    { key: 'CURRENT_LIABILITIES', label: 'Current liabilities', unit: 'Currency' },
    { key: 'TOTAL_EQUITY', label: 'Total equity', unit: 'Currency' },
  ],
  CASH_FLOW: [
    { key: 'CFO', label: 'Cash flow from operations', unit: 'Currency' },
    { key: 'CAPEX', label: 'Capital expenditure', unit: 'Currency' },
    { key: 'FREE_CASH_FLOW', label: 'Free cash flow', unit: 'Currency' },
  ],
};

/** Builds statement columns from supplied observations only; it never fills gaps or mixes period types. */
export function buildStatementColumns(
  observations: readonly MetricObservation[],
  statement: StatementKind,
  periodType: Extract<PeriodType, 'ANNUAL' | 'QUARTERLY' | 'TTM'>,
): StatementColumn[] {
  const definitions = STATEMENT_LINES[statement];
  const relevant = observations.filter(item => item.periodType === periodType && definitions.some(line => line.key === item.metricKey));
  const periodEnds = [...new Set(relevant.map(item => item.periodEnd).filter(Boolean))].sort((a, b) => b.localeCompare(a));
  return periodEnds.map(periodEnd => ({
    periodType,
    periodEnd,
    label: `${periodType} · ${periodEnd}`,
    lines: definitions.map(definition => {
      const matches = relevant.filter(item => item.metricKey === definition.key && item.periodEnd === periodEnd)
        .sort((a, b) => b.sourceRetrievedAt.localeCompare(a.sourceRetrievedAt));
      const chosen = matches[0];
      return {
        key: definition.key,
        label: definition.label,
        unit: chosen?.unit ?? definition.unit,
        value: chosen?.value ?? null,
        status: chosen?.status ?? 'MISSING',
        observationId: chosen?.observationId ?? null,
        periodEnd: chosen?.periodEnd ?? null,
      };
    }),
  }));
}
