export type QualityFactor = 'PROFITABILITY' | 'GROWTH' | 'FINANCIAL_HEALTH' | 'CASH_FLOW' | 'VALUATION' | 'GOVERNANCE_RISK';
export interface FactorInput { factor: QualityFactor; score: number | null; weight: number; evidence: string[]; }
export interface FactorResult extends FactorInput { contribution: number | null; }
export interface QualityResult { score: number | null; coverage: number; status: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA'; factors: FactorResult[]; methodology: string; }
const FACTORS: QualityFactor[] = ['PROFITABILITY','GROWTH','FINANCIAL_HEALTH','CASH_FLOW','VALUATION','GOVERNANCE_RISK'];

/** Combines pre-scored, evidence-backed factors. It does not invent factor scores from missing metrics. */
export function calculateQualityScore(inputs: FactorInput[], minimumCoverage = 0.6): QualityResult {
  const byFactor = new Map(inputs.map(item => [item.factor, item]));
  const normalized = FACTORS.map(factor => {
    const item = byFactor.get(factor) ?? { factor, score: null, weight: 1, evidence: [] };
    const validWeight = Number.isFinite(item.weight) && item.weight > 0 ? item.weight : 0;
    const validScore = item.score !== null && Number.isFinite(item.score) && item.score >= 0 && item.score <= 100;
    return { ...item, weight: validWeight, score: validScore ? item.score : null };
  });
  const totalWeight = normalized.reduce((sum, item) => sum + item.weight, 0);
  const availableWeight = normalized.filter(item => item.score !== null).reduce((sum, item) => sum + item.weight, 0);
  const coverage = totalWeight ? availableWeight / totalWeight : 0;
  const score = availableWeight ? normalized.reduce((sum, item) => sum + (item.score ?? 0) * (item.score === null ? 0 : item.weight), 0) / availableWeight : null;
  const status = score === null || coverage < minimumCoverage ? 'INSUFFICIENT_DATA' : coverage >= 0.999 ? 'COMPLETE' : 'PARTIAL';
  return {
    score: status === 'INSUFFICIENT_DATA' ? null : score,
    coverage,
    status,
    factors: normalized.map(item => ({ ...item, contribution: item.score === null || !availableWeight ? null : item.score * item.weight / availableWeight })),
    methodology: 'Six-factor weighted framework; weights are normalized across evidenced factors only. Coverage is disclosed and the score is withheld below the configured coverage threshold.'
  };
}
