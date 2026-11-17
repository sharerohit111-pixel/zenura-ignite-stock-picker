import { describe, expect, it } from 'vitest';
import { calculateQualityScore } from './engine';
const factor=(score:number|null,weight=1)=>({factor:'PROFITABILITY' as const,score,weight,evidence:score===null?[]:['audited annual filing']});
describe('calculateQualityScore',()=>{
 it('withholds score below minimum coverage',()=>{const r=calculateQualityScore([factor(80)],0.6);expect(r.status).toBe('INSUFFICIENT_DATA');expect(r.score).toBeNull();});
 it('calculates weighted score and coverage transparently',()=>{const r=calculateQualityScore([factor(80,2),{...factor(60),factor:'GROWTH' as const}],0.3);expect(r.status).toBe('PARTIAL');expect(r.coverage).toBeCloseTo(3/7);expect(r.score).toBeCloseTo(73.333333);});
 it('rejects duplicate factors and invalid thresholds',()=>{expect(calculateQualityScore([factor(80),factor(70)]).score).toBeNull();expect(calculateQualityScore([factor(80)],1.2).score).toBeNull();});
 it('requires evidence for every scored factor',()=>{expect(calculateQualityScore([{factor:'PROFITABILITY',score:80,weight:1,evidence:[]}]).score).toBeNull();});
 it('requires evidence before accepting a scored factor',()=>{expect(calculateQualityScore([{factor:'PROFITABILITY',score:80,weight:1,evidence:[]}]).score).toBeNull();});
 it('does not accept out-of-range scores or negative weights',()=>{expect(calculateQualityScore([{...factor(140)}]).score).toBeNull();expect(calculateQualityScore([factor(70,-1)]).score).toBeNull();});
});
