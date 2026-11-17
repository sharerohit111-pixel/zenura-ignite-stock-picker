import type { MetricObservation } from './types';

const finiteOrNull = (value: number | null): boolean => value === null || Number.isFinite(value);

/** Reject malformed observations; missing values stay null and are never silently coerced to zero. */
export function validateObservation(input: MetricObservation): string[] {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return ['observation must be an object'];
  if (typeof input.observationId !== 'string' || !input.observationId.trim()) errors.push('observationId is required');
  if (typeof input.companyId !== 'string' || !input.companyId.trim()) errors.push('companyId is required');
  if (typeof input.sourceId !== 'string' || !input.sourceId.trim()) errors.push('sourceId is required');
  if (input.value !== null && (typeof input.value !== 'number' || !finiteOrNull(input.value))) errors.push('value must be finite or null');
  if (input.value === null && input.status !== 'MISSING') errors.push('null value must use MISSING status');
  if (input.value !== null && input.status === 'MISSING') errors.push('non-null value cannot use MISSING status');
  const periodEnd = typeof input.periodEnd === 'string' ? Date.parse(input.periodEnd) : NaN;
  const retrievedAt = typeof input.sourceRetrievedAt === 'string' ? Date.parse(input.sourceRetrievedAt) : NaN;
  const ingestedAt = typeof input.ingestedAt === 'string' ? Date.parse(input.ingestedAt) : NaN;
  if (!Number.isFinite(periodEnd)) errors.push('periodEnd must be a valid date');
  if (!Number.isFinite(retrievedAt)) errors.push('sourceRetrievedAt must be a valid timestamp');
  if (!Number.isFinite(ingestedAt)) errors.push('ingestedAt must be a valid timestamp');
  if (input.periodStart !== undefined) {
    const periodStart = typeof input.periodStart === 'string' ? Date.parse(input.periodStart) : NaN;
    if (!Number.isFinite(periodStart)) errors.push('periodStart must be a valid date');
    else if (Number.isFinite(periodEnd) && periodStart > periodEnd) errors.push('periodStart cannot be after periodEnd');
  }
  if (Number.isFinite(retrievedAt) && Number.isFinite(ingestedAt) && ingestedAt < retrievedAt) errors.push('ingestedAt cannot be before sourceRetrievedAt');
  return errors;
}

export interface DerivedValueResult { value: number | null; reason?: string; }

/** Safe ratio helper: zero denominators and non-finite inputs produce an unavailable value. */
export function safeDivide(numerator: number | null, denominator: number | null, multiplier = 1): DerivedValueResult {
  if (numerator === null || denominator === null) return { value: null, reason: 'Required input is missing' };
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || !Number.isFinite(multiplier)) return { value: null, reason: 'Input is not finite' };
  if (denominator === 0) return { value: null, reason: 'Denominator is zero' };
  const value = (numerator / denominator) * multiplier;
  return Number.isFinite(value) ? { value } : { value: null, reason: 'Calculated result is not finite' };
}

/** Invalid component weights or scores invalidate the result rather than silently changing the model. */
export function calculateWeightedScore(components: Array<{ score: number | null; weight: number }>): {
  score: number | null; coverage: number; status: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA'
} {
  if (!Array.isArray(components) || components.length === 0) return { score: null, coverage: 0, status: 'INSUFFICIENT_DATA' };
  const invalid = components.some(c => !c || !Number.isFinite(c.weight) || c.weight < 0 ||
    (c.score !== null && (!Number.isFinite(c.score) || c.score < 0 || c.score > 100)));
  if (invalid) return { score: null, coverage: 0, status: 'INSUFFICIENT_DATA' };
  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
  const valid = components.filter(c => c.score !== null && c.weight > 0);
  const validWeight = valid.reduce((sum, c) => sum + c.weight, 0);
  const coverage = totalWeight > 0 ? validWeight / totalWeight : 0;
  if (valid.length === 0 || validWeight === 0) return { score: null, coverage, status: 'INSUFFICIENT_DATA' };
  const score = valid.reduce((sum, c) => sum + (c.score as number) * c.weight, 0) / validWeight;
  return { score, coverage, status: coverage >= 0.999999 ? 'COMPLETE' : 'PARTIAL' };
}
