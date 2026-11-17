import { describe, expect, it } from 'vitest';
import { calculateWeightedScore, safeDivide, validateObservation } from './validation';
import type { MetricObservation } from './types';
const validObservation:MetricObservation={observationId:'o1',companyId:'c1',metricKey:'REVENUE',value:100,unit:'CURRENCY',periodType:'ANNUAL',periodStart:'2024-04-01',periodEnd:'2025-03-31',sourceId:'filing',sourceRetrievedAt:'2025-05-01T00:00:00Z',ingestedAt:'2025-05-02T00:00:00Z',status:'VERIFIED'};
describe('data contract validation',()=>{
 it('accepts a valid observation and rejects ingestion timestamps before retrieval',()=>{expect(validateObservation(validObservation)).toEqual([]);expect(validateObservation({...validObservation,ingestedAt:'2025-04-01T00:00:00Z'})).toContain('ingestedAt cannot be before sourceRetrievedAt');});
 it('rejects unknown period, unit, metric and status values',()=>{const invalid={...validObservation,periodType:'YEARLY',unit:'UNKNOWN',metricKey:'NOT_A_METRIC',status:'OK'} as unknown as MetricObservation;expect(validateObservation(invalid)).toEqual(expect.arrayContaining(['metricKey is not recognized','unit is not recognized','periodType is not recognized','status is not recognized']));});
 it('rejects invalid date ranges and keeps null distinct from zero',()=>{expect(validateObservation({...validObservation,periodStart:'2025-04-01'})).toContain('periodStart cannot be after periodEnd');expect(validateObservation({...validObservation,value:null,status:'VERIFIED'})).toContain('null value must use MISSING status');});
 it('returns unavailable for division by zero or non-finite multiplier',()=>{expect(safeDivide(5,0).value).toBeNull();expect(safeDivide(5,2,Number.NaN).value).toBeNull();});
 it('calculates coverage only from valid weighted evidence',()=>{expect(calculateWeightedScore([{score:80,weight:2},{score:null,weight:2}])).toEqual({score:80,coverage:0.5,status:'PARTIAL'});expect(calculateWeightedScore([{score:120,weight:1}]).score).toBeNull();expect(calculateWeightedScore([{score:80,weight:-1}]).status).toBe('INSUFFICIENT_DATA');});
});
