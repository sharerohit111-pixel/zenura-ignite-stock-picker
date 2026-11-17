import type { MetricObservation } from './types';

const finiteOrNull = (value: number | null): boolean => value === null || Number.isFinite(value);

/** Reject malformed observations; missing values stay null and are never silently coerced to zero. */
export function validateObservation(input: MetricObservation): string[] {
  const errors: string[] = [];
  if (!input.observationId.trim()) errors.push('observationId is required');
  if (!input.companyId.trim()) errors.push('companyId is required');
  if (!input.sourceId.trim()) errors.push('sourceId is required');
  if (!finiteOrNull(input.value)) errors.push('value must be finite or null');
  if (input.value === null && input.status !== 'MISSING') errors.push('null value must use MISSING status');
  if (input.value !== null && input.status === 'MISSING') errors.push('non-null value cannot use MISSING status');
  if (Number.isNaN(Date.parse(input.periodEnd))) errors.push('periodEnd must be a valid date');
  if (Number.isNaN(Date.parse(input.sourceRetrievedAt))) errors.push('sourceRetrievedAt must be a valid timestamp');
  if (Number.isNaN(Date.parse(input.ingestedAt))) errors.push('ingestedAt must be a valid timestamp');
  if (input.periodStart && Date.parse(input.periodStart) > Date.parse(input.periodEnd)) errors.push('periodStart cannot be after periodEnd');
  return errors;
}

export interface DerivedValueResult {
  value: number | null;
  reason?: string;
}

/** Safe ratio helper: zero denominators and non-finite inputs produce an unavailable value. */
export function safeDivide(numerator: number | null, denominator: number | null, multiplier = 1): DerivedValueResult {
  if (numerator === null || denominator === null) return { value: null, reason: 'Required input is missing' };
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) return { value: null, reason: 'Input is not finite' };
  if (denominator === 0) return { value: null, reason: 'Denominator is zero' };
  const value = (numerator / denominator) * multiplier;
  return Number.isFinite(value) ? { value } : { value: null, reason: 'Calculated result is not finite' };
}

/** A partial score must be visibly partial; weights are re-normalized only across available components. */
export function calculateWeightedScore(components: Array<{ score: number | null; weight: number }>): {
  score: number | null; coverage: number; status: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA'
} {
  const valid = components.filter((c) => c.score !== null && Number.isFinite(c.score) && c.weight > 0);
  const totalWeight = components.reduce((sum, c) => sum + Math.max(0, c.weight), 0);
  const validWeight = valid.reduce((sum, c) => sum + c.weight, 0);
  const coverage = totalWeight > 0 ? validWeight / totalWeight : 0;
  if (valid.length === 0 || validWeight === 0) return { score: null, coverage, status: 'INSUFFICIENT_DATA' };
  const score = valid.reduce((sum, c) => sum + (c.score as number) * c.weight, 0) / validWeight;
  return { score, coverage, status: coverage >= 0.999 ? 'COMPLETE' : 'PARTIAL' };
}
