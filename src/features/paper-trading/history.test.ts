import { describe, expect, it } from 'vitest';
import { filterPaperTradesByDate } from './history';
import type { PaperTrade } from './engine';

const trades:PaperTrade[]=[
 {id:'a',symbol:'TCS',side:'BUY',quantity:1,price:100,grossValue:100,executedAt:'2026-11-16T08:00:00.000Z'},
 {id:'b',symbol:'INFY',side:'BUY',quantity:1,price:200,grossValue:200,executedAt:'2026-11-17T12:30:00.000Z'},
 {id:'c',symbol:'ITC',side:'SELL',quantity:1,price:300,grossValue:300,executedAt:'2026-11-18T18:00:00.000Z'}
];

describe('paper trade date filter',()=>{
 it('includes both boundary calendar dates',()=>{
  expect(filterPaperTradesByDate(trades,{from:'2026-11-17',to:'2026-11-18'}).map(t=>t.id)).toEqual(['b','c']);
 });
 it('supports open-ended ranges and empty range',()=>{
  expect(filterPaperTradesByDate(trades,{from:'2026-11-18'}).map(t=>t.id)).toEqual(['c']);
  expect(filterPaperTradesByDate(trades,{})).toHaveLength(3);
 });
 it('returns no rows for invalid or reversed ranges',()=>{
  expect(filterPaperTradesByDate(trades,{from:'bad'})).toEqual([]);
  expect(filterPaperTradesByDate(trades,{from:'2026-11-19',to:'2026-11-17'})).toEqual([]);
 });
});
