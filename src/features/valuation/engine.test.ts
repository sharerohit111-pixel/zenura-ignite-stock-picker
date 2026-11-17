import { describe, expect, it } from 'vitest';
import { calculateDcf } from './engine';
const base={baseFreeCashFlow:100,growthRate:0.05,discountRate:0.1,terminalGrowthRate:0.03,forecastYears:5,netDebt:100,sharesOutstanding:10};
describe('calculateDcf',()=>{
 it('returns finite enterprise and per-share values for valid assumptions',()=>{const r=calculateDcf(base);expect(r.ok).toBe(true);if(r.ok){expect(Number.isFinite(r.result.enterpriseValue)).toBe(true);expect(r.result.intrinsicValuePerShare).toBeCloseTo(r.result.equityValue/10);}});
 it('rejects discount rate not above terminal growth',()=>{const r=calculateDcf({...base,discountRate:0.03});expect(r.ok).toBe(false);});
 it('rejects non-positive shares and invalid horizon',()=>{expect(calculateDcf({...base,sharesOutstanding:0}).ok).toBe(false);expect(calculateDcf({...base,forecastYears:11}).ok).toBe(false);});
 it('supports negative net debt (net cash)',()=>{const r=calculateDcf({...base,netDebt:-50});expect(r.ok&&r.result.equityValue>r.result.enterpriseValue).toBe(true);});
});
