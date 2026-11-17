import { describe, expect, it } from 'vitest';
import { runScreener, loadSavedScreens, saveScreen, deleteSavedScreen, type ScreenerRow, type SavedScreen } from './engine';
import type { MetricObservation } from '../../platform/data-contracts/types';
const obs=(value:number|null,status:'VERIFIED'|'STALE'='VERIFIED',date='2025-03-31'):MetricObservation=>({observationId:date+String(value),companyId:'c1',metricKey:'PE',value,unit:'MULTIPLE',periodType:'ANNUAL',periodEnd:date,sourceId:'filing',sourceRetrievedAt:date,ingestedAt:date,status});
const rows:ScreenerRow[]=[{company:{companyId:'c1',name:'Alpha',identityStatus:'CONFIRMED'},observations:[obs(12)]},{company:{companyId:'c2',name:'Beta',identityStatus:'CONFIRMED'},observations:[obs(24,'STALE')]},{company:{companyId:'c3',name:'Gamma',identityStatus:'PROVISIONAL'},observations:[]}];
describe('runScreener',()=>{
 it('filters verified metric observations and excludes unconfirmed identities by default',()=>{const r=runScreener(rows,{rules:[{metric:'PE',operator:'LT',value:20,verifiedOnly:true}]});expect(r.rows.map(x=>x.company.name)).toEqual(['Alpha']);expect(r.excludedForIdentity).toBe(1);});
 it('finds missing observations without treating them as zero',()=>{const r=runScreener(rows,{rules:[{metric:'PE',operator:'IS_MISSING'}],includeUnverifiedIdentity:true});expect(r.rows.map(x=>x.company.name)).toEqual(['Gamma']);});
 it('counts companies with missing data once even when multiple filters fail',()=>{const r=runScreener(rows,{rules:[{metric:'PE',operator:'LT',value:20},{metric:'ROE',operator:'GT',value:15}]});expect(r.excludedForData).toBe(1);});
 it('prefers verified observations over newer unverified data when verification is not forced',()=>{const row:ScreenerRow={company:{companyId:'c4',name:'Delta',identityStatus:'CONFIRMED'},observations:[obs(14,'VERIFIED','2024-03-31'),obs(99,'STALE','2025-03-31')]};const r=runScreener([row],{rules:[{metric:'PE',operator:'GT',value:50}]});expect(r.matched).toBe(0);});
 it('sorts illustrative unverified observations only when the demo option is enabled',()=>{const demo:ScreenerRow[]=[{company:{companyId:'d1',name:'Alpha',identityStatus:'PROVISIONAL'},observations:[{...obs(12,'STALE'),status:'UNVERIFIED'}]},{company:{companyId:'d2',name:'Beta',identityStatus:'PROVISIONAL'},observations:[{...obs(24,'STALE'),companyId:'d2',status:'UNVERIFIED'}]}];const r=runScreener(demo,{rules:[],sortBy:'PE',sortDirection:'DESC',includeUnverifiedIdentity:true,includeUnverifiedValuesForSort:true});expect(r.rows.map(x=>x.company.name)).toEqual(['Beta','Alpha']);});
 it('sorts with missing values last',()=>{const r=runScreener(rows.slice(0,2),{rules:[],sortBy:'PE',sortDirection:'DESC'});expect(r.rows.map(x=>x.company.name)).toEqual(['Alpha','Beta']);});
 it('checks the latest period for IS_MISSING instead of preferring an older verified value',()=>{const row:ScreenerRow={company:{companyId:'c5',name:'Epsilon',identityStatus:'CONFIRMED'},observations:[obs(10,'VERIFIED','2024-03-31'),obs(null,'STALE','2025-03-31')]};const r=runScreener([row],{rules:[{metric:'PE',operator:'IS_MISSING'}]});expect(r.matched).toBe(1);});
 it('does not call a newer present value missing because an older period was missing',()=>{const row:ScreenerRow={company:{companyId:'c6',name:'Zeta',identityStatus:'CONFIRMED'},observations:[obs(null,'STALE','2024-03-31'),obs(16,'VERIFIED','2025-03-31')]};const r=runScreener([row],{rules:[{metric:'PE',operator:'IS_MISSING'}]});expect(r.matched).toBe(0);});
 it('supports greater-than, equality and inclusive between custom rules',()=>{
  const candidates:ScreenerRow[]=[
   {company:{companyId:'a',name:'A',identityStatus:'CONFIRMED'},observations:[obs(10)]},
   {company:{companyId:'b',name:'B',identityStatus:'CONFIRMED'},observations:[obs(20)]},
   {company:{companyId:'c',name:'C',identityStatus:'CONFIRMED'},observations:[obs(30)]}
  ];
  expect(runScreener(candidates,{rules:[{metric:'PE',operator:'GT',value:10}]}).rows.map(x=>x.company.name)).toEqual(['B','C']);
  expect(runScreener(candidates,{rules:[{metric:'PE',operator:'EQ',value:20}]}).rows.map(x=>x.company.name)).toEqual(['B']);
  expect(runScreener(candidates,{rules:[{metric:'PE',operator:'BETWEEN',value:10,upperValue:20}]}).rows.map(x=>x.company.name)).toEqual(['A','B']);
 });

});


describe('saved screener settings',()=>{
 const makeStorage=()=>{
  const values=new Map<string,string>();
  return {getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value);}};
 };
 it('persists and restores saved filter and sort settings',()=>{
  const storage=makeStorage();
  const screen:SavedScreen={id:'screen-1',name:'Value shortlist',rules:[{metric:'PE',operator:'LTE',value:20}],search:'alpha',updatedAt:'2026-11-17T00:00:00.000Z',sortMetric:'ROE',sortDirection:'ASC'};
  saveScreen(screen,storage);
  expect(loadSavedScreens(storage)).toEqual([screen]);
 });
 it('accepts older saved screens without sort settings',()=>{
  const storage=makeStorage();
  const legacy={id:'screen-old',name:'Legacy',rules:[],search:'',updatedAt:'2026-11-16T00:00:00.000Z'};
  storage.setItem('zi-saved-screens-v1',JSON.stringify([legacy]));
  expect(loadSavedScreens(storage)).toEqual([legacy]);
 });
 it('deletes only the selected saved screen',()=>{
  const storage=makeStorage();
  const first:SavedScreen={id:'one',name:'One',rules:[],search:'',updatedAt:'2026-11-17T00:00:00.000Z'};
  const second:SavedScreen={...first,id:'two',name:'Two'};
  saveScreen(first,storage);saveScreen(second,storage);
  expect(deleteSavedScreen('one',storage).map(item=>item.id)).toEqual(['two']);
 });
});
