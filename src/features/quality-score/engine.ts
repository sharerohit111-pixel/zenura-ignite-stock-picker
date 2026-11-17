export type QualityFactor = 'PROFITABILITY' | 'GROWTH' | 'FINANCIAL_HEALTH' | 'CASH_FLOW' | 'VALUATION' | 'GOVERNANCE_RISK';
export interface FactorInput { factor: QualityFactor; score: number | null; weight: number; evidence: string[]; }
export interface FactorResult extends FactorInput { contribution: number | null; }
export interface QualityResult { score: number | null; coverage: number; status: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA'; factors: FactorResult[]; methodology: string; }
const FACTORS: QualityFactor[] = ['PROFITABILITY','GROWTH','FINANCIAL_HEALTH','CASH_FLOW','VALUATION','GOVERNANCE_RISK'];
const METHODOLOGY = 'Six-factor weighted framework; weights are normalized across evidenced factors only. Coverage is disclosed and the score is withheld below the configured coverage threshold.';

/** Combines pre-scored, evidence-backed factors. Duplicate factors are rejected; missing scores are never imputed. */
export function calculateQualityScore(inputs: FactorInput[], minimumCoverage = 0.6): QualityResult {
  const errors = !Number.isFinite(minimumCoverage) || minimumCoverage < 0 || minimumCoverage > 1;
  const duplicates = inputs.some((item, index) => inputs.findIndex(other => other.factor === item.factor) !== index);
  const validFactors = new Set<QualityFactor>(FACTORS);
  const invalidInput = inputs.some(item => !validFactors.has(item.factor) ||
    !Number.isFinite(item.weight) || item.weight < 0 ||
    (item.score !== null && (!Number.isFinite(item.score) || item.score < 0 || item.score > 100)) ||
    !Array.isArray(item.evidence) || (item.score !== null && (!Array.isArray(item.evidence) || item.evidence.length === 0 || item.evidence.some(source => typeof source !== 'string' || !source.trim()))));
  const invalid = errors || duplicates || invalidInput;
  const byFactor = new Map(inputs.map(item => [item.factor, item]));
  const normalized = FACTORS.map(factor => {
    const item = byFactor.get(factor) ?? { factor, score: null, weight: 1, evidence: [] };
    const scoreValid = item.score !== null && Number.isFinite(item.score) && item.score >= 0 && item.score <= 100;
    return { ...item, weight: Number.isFinite(item.weight) && item.weight > 0 ? item.weight : 0, score: scoreValid ? item.score : null };
  });
  const totalWeight = normalized.reduce((sum, item) => sum + item.weight, 0);
  const availableWeight = normalized.filter(item => item.score !== null).reduce((sum, item) => sum + item.weight, 0);
  const coverage = totalWeight > 0 ? availableWeight / totalWeight : 0;
  const weightedTotal = normalized.reduce((sum, item) => sum + (item.score ?? 0) * (item.score === null ? 0 : item.weight), 0);
  const calculated = availableWeight > 0 ? weightedTotal / availableWeight : null;
  const status = invalid || calculated === null || coverage < minimumCoverage ? 'INSUFFICIENT_DATA' : coverage >= 0.999999 ? 'COMPLETE' : 'PARTIAL';
  return {
    score: status === 'INSUFFICIENT_DATA' ? null : calculated,
    coverage,
    status,
    factors: normalized.map(item => ({ ...item, contribution: item.score === null || !availableWeight ? null : item.score * item.weight / availableWeight })),
    methodology: invalid ? METHODOLOGY + ' Input validation failed: check coverage threshold, duplicate factors, weights, scores and evidence.' : METHODOLOGY
  };
}
