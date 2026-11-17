import { describe, expect, it } from 'vitest';
import { buildComparison } from './engine';
import type { MetricObservation } from '../../platform/data-contracts/types';
const observation=(companyId:string,value:number,status:'VERIFIED'|'UNVERIFIED'='VERIFIED',periodEnd='2025-03-31'):MetricObservation=>({observationId:companyId+periodEnd,companyId,metricKey:'ROE',value,unit:'PERCENT',periodType:'ANNUAL',periodEnd,sourceId:'filing',sourceRetrievedAt:'2025-05-01T00:00:00Z',ingestedAt:'2025-05-02T00:00:00Z',status});
describe('buildComparison',()=>{
 it('compares only verified values with the exact same period end',()=>{const companies=[{companyId:'a',name:'A',observations:[observation('a',20)]},{companyId:'b',name:'B',observations:[observation('b',15)]}];const [r]=buildComparison(companies,['ROE'],'ANNUAL');expect(r.comparable).toBe(true);expect(r.cells.map(c=>c.value)).toEqual([20,15]);});
 it('flags unlike period ends and withholds comparability',()=>{const [r]=buildComparison([{companyId:'a',name:'A',observations:[observation('a',20)]},{companyId:'b',name:'B',observations:[observation('b',15,'VERIFIED','2024-03-31')]}],['ROE'],'ANNUAL');expect(r.comparable).toBe(false);expect(r.cells.every(c=>c.status==='PERIOD_MISMATCH')).toBe(true);});
 it('withholds comparability for unverified and missing observations',()=>{const [unverified]=buildComparison([{companyId:'a',name:'A',observations:[observation('a',20,'UNVERIFIED')]}],['ROE'],'ANNUAL');expect(unverified.comparable).toBe(false);const [missing]=buildComparison([{companyId:'a',name:'A',observations:[]}],['ROE'],'ANNUAL');expect(missing.cells[0].status).toBe('MISSING');});
});
