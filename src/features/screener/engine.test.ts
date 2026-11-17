import { describe, expect, it } from 'vitest';
import { runScreener, type ScreenerRow } from './engine';
import type { MetricObservation } from '../../platform/data-contracts/types';
const obs=(value:number|null,status:'VERIFIED'|'STALE'='VERIFIED',date='2025-03-31'):MetricObservation=>({observationId:date+String(value),companyId:'c1',metricKey:'PE',value,unit:'MULTIPLE',periodType:'ANNUAL',periodEnd:date,sourceId:'filing',sourceRetrievedAt:date,ingestedAt:date,status});
const rows:ScreenerRow[]=[{company:{companyId:'c1',name:'Alpha',identityStatus:'CONFIRMED'},observations:[obs(12)]},{company:{companyId:'c2',name:'Beta',identityStatus:'CONFIRMED'},observations:[obs(24,'STALE')]},{company:{companyId:'c3',name:'Gamma',identityStatus:'PROVISIONAL'},observations:[]}];
describe('runScreener',()=>{
 it('filters verified metric observations and excludes unconfirmed identities by default',()=>{const r=runScreener(rows,{rules:[{metric:'PE',operator:'LT',value:20,verifiedOnly:true}]});expect(r.rows.map(x=>x.company.name)).toEqual(['Alpha']);expect(r.excludedForIdentity).toBe(1);});
 it('finds missing observations without treating them as zero',()=>{const r=runScreener(rows,{rules:[{metric:'PE',operator:'IS_MISSING'}]});expect(r.rows.map(x=>x.company.name)).toEqual(['Gamma']);});
 it('sorts with missing values last',()=>{const r=runScreener(rows.slice(0,2),{rules:[],sortBy:'PE',sortDirection:'DESC'});expect(r.rows.map(x=>x.company.name)).toEqual(['Beta','Alpha']);});
});
