export interface DcfAssumptions {
  /** Latest full-year free cash flow in the selected currency units. */
  baseFreeCashFlow: number;
  growthRate: number;
  discountRate: number;
  terminalGrowthRate: number;
  forecastYears: number;
  netDebt: number;
  sharesOutstanding: number;
}
export interface DcfResult {
  enterpriseValue: number;
  equityValue: number;
  intrinsicValuePerShare: number;
  presentValueForecast: number;
  presentValueTerminal: number;
  terminalValue: number;
  assumptions: DcfAssumptions;
  warnings: string[];
}
export type DcfResultState = { ok: true; result: DcfResult } | { ok: false; errors: string[] };

/** Five-year (or user-selected horizon) FCFF DCF. Currency units must be consistent. */
export function calculateDcf(input: DcfAssumptions): DcfResultState {
  const errors: string[] = [];
  const finite = (n: number) => Number.isFinite(n);
  if (!finite(input.baseFreeCashFlow) || input.baseFreeCashFlow <= 0) errors.push('Base free cash flow must be greater than zero.');
  if (!finite(input.growthRate) || input.growthRate <= -1 || input.growthRate > 1) errors.push('Growth rate must be between -100% and 100%.');
  if (!finite(input.discountRate) || input.discountRate <= 0 || input.discountRate > 1) errors.push('Discount rate must be above 0% and at most 100%.');
  if (!finite(input.terminalGrowthRate) || input.terminalGrowthRate < -0.5 || input.terminalGrowthRate > 0.5) errors.push('Terminal growth must be between -50% and 50%.');
  if (finite(input.discountRate) && finite(input.terminalGrowthRate) && input.discountRate <= input.terminalGrowthRate) errors.push('Discount rate must exceed terminal growth rate.');
  if (!Number.isInteger(input.forecastYears) || input.forecastYears < 1 || input.forecastYears > 10) errors.push('Forecast horizon must be 1 to 10 years.');
  if (!finite(input.netDebt)) errors.push('Net debt must be a finite number.');
  if (!finite(input.sharesOutstanding) || input.sharesOutstanding <= 0) errors.push('Shares outstanding must be greater than zero.');
  if (errors.length) return { ok: false, errors };

  let presentValueForecast = 0;
  let finalFcf = input.baseFreeCashFlow;
  for (let year = 1; year <= input.forecastYears; year++) {
    finalFcf *= 1 + input.growthRate;
    const discountedFcf = finalFcf / Math.pow(1 + input.discountRate, year);
    presentValueForecast += discountedFcf;
    if (![finalFcf, discountedFcf, presentValueForecast].every(finite)) {
      return { ok: false, errors: ['Assumptions produce a non-finite forecast. Reduce the cash flow or growth assumptions.'] };
    }
  }

  const terminalValue = finalFcf * (1 + input.terminalGrowthRate) / (input.discountRate - input.terminalGrowthRate);
  const presentValueTerminal = terminalValue / Math.pow(1 + input.discountRate, input.forecastYears);
  const enterpriseValue = presentValueForecast + presentValueTerminal;
  const equityValue = enterpriseValue - input.netDebt;
  const intrinsicValuePerShare = equityValue / input.sharesOutstanding;
  if (![terminalValue, presentValueTerminal, enterpriseValue, equityValue, intrinsicValuePerShare].every(finite)) {
    return { ok: false, errors: ['Assumptions produce a non-finite valuation result. Review cash flow, net debt and shares outstanding.'] };
  }

  const warnings = [
    'Illustrative model output, not a target price or investment recommendation.',
    'FCFF, discount rate, terminal growth, net debt and share count must use consistent definitions and dates.',
    'A DCF is highly sensitive to assumptions; test a range of scenarios before relying on the result.'
  ];
  if (equityValue <= 0) warnings.push('Modelled equity value is zero or negative; per-share output is not economically meaningful.');
  return { ok: true, result: { enterpriseValue, equityValue, intrinsicValuePerShare, presentValueForecast, presentValueTerminal, terminalValue, assumptions: { ...input }, warnings } };
}
