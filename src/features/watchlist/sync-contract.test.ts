import { describe, expect, it } from 'vitest';
import { validateCloudSnapshot } from './sync-contract';
const allowed=['DEMO1','DEMO2'];
const valid={revision:'opaque-etag-1',updatedAt:'2026-11-17T10:00:00.000Z',symbols:['DEMO1'],research:{DEMO1:{status:'Researching',notes:'Review latest filing'}}};
describe('validateCloudSnapshot',()=>{
 it('accepts a valid server snapshot',()=>expect(validateCloudSnapshot(valid,allowed)).toBe(true));
 it('rejects unknown symbols and duplicate symbols',()=>{
  expect(validateCloudSnapshot({...valid,symbols:['UNKNOWN']},allowed)).toBe(false);
  expect(validateCloudSnapshot({...valid,symbols:['DEMO1','DEMO1']},allowed)).toBe(false);
 });
 it('rejects malformed metadata and notes',()=>{
  expect(validateCloudSnapshot({...valid,revision:''},allowed)).toBe(false);
  expect(validateCloudSnapshot({...valid,updatedAt:'not-a-date'},allowed)).toBe(false);
  expect(validateCloudSnapshot({...valid,research:{DEMO1:{status:'Researching',notes:'x'.repeat(5001)}}},allowed)).toBe(false);
 });
 it('rejects invalid status, research key and malformed payloads',()=>{
  expect(validateCloudSnapshot({...valid,research:{DEMO1:{status:'Admin',notes:''}}},allowed)).toBe(false);
  expect(validateCloudSnapshot({...valid,research:{UNKNOWN:{status:'Completed',notes:''}}},allowed)).toBe(false);
  expect(validateCloudSnapshot(null,allowed)).toBe(false);
 });
});
