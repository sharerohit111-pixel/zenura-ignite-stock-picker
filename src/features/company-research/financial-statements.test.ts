import { describe, expect, it } from 'vitest';
import { buildStatementColumns } from './financial-statements';
import type { MetricObservation } from '../../platform/data-contracts/types';
const observation=(metricKey:'REVENUE'|'PAT',value:number,periodType:'ANNUAL'|'QUARTERLY'|'TTM',periodEnd:string):MetricObservation=>({observationId:metricKey+periodEnd,companyId:'c1',metricKey,value,unit:'CURRENCY',periodType,periodEnd,sourceId:'filing',sourceRetrievedAt:'2025-05-01T00:00:00Z',ingestedAt:'2025-05-02T00:00:00Z',status:'VERIFIED'});
describe('buildStatementColumns',()=>{
 it('keeps annual, quarterly and TTM observations separate',()=>{const data=[observation('REVENUE',100,'ANNUAL','2025-03-31'),observation('REVENUE',30,'QUARTERLY','2025-03-31'),observation('REVENUE',110,'TTM','2025-03-31')];expect(buildStatementColumns(data,'INCOME','ANNUAL')[0].lines[0].value).toBe(100);expect(buildStatementColumns(data,'INCOME','QUARTERLY')[0].lines[0].value).toBe(30);expect(buildStatementColumns(data,'INCOME','TTM')[0].lines[0].value).toBe(110);});
 it('does not convert missing values to zero',()=>{const columns=buildStatementColumns([observation('REVENUE',100,'ANNUAL','2025-03-31')],'INCOME','ANNUAL');const pat=columns[0].lines.find(line=>line.key==='PAT');expect(pat?.value).toBeNull();expect(pat?.status).toBe('MISSING');});
 it('prefers verified observations over newer unverified copies',()=>{const base=observation('REVENUE',100,'ANNUAL','2025-03-31');const newer={...base,value:999,status:'UNVERIFIED' as const,sourceRetrievedAt:'2025-06-01T00:00:00Z'};expect(buildStatementColumns([base,newer],'INCOME','ANNUAL')[0].lines[0].value).toBe(100);});
 it('returns no columns when the requested period has no data',()=>{expect(buildStatementColumns([observation('REVENUE',100,'ANNUAL','2025-03-31')],'INCOME','TTM')).toEqual([]);});
});
