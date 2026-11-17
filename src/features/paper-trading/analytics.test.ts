import { describe, expect, it } from 'vitest';
import { calculatePaperTradingAnalytics } from './analytics';
import type { PaperTrade } from './engine';

const t=(side:'BUY'|'SELL',quantity:number,price:number,symbol='TCS'):PaperTrade=>({
 id:`${side}-${quantity}-${price}`,symbol,side,quantity,price,grossValue:quantity*price,executedAt:'2026-11-17T10:00:00Z'
});
describe('paper trading analytics',()=>{
 it('calculates weighted-average realized profit/loss and turnover',()=>{
  const result=calculatePaperTradingAnalytics([t('BUY',10,100),t('BUY',10,120),t('SELL',5,130)]);
  expect(result.valid).toBe(true);
  expect(result.buyTurnover).toBe(2200);
  expect(result.sellTurnover).toBe(650);
  expect(result.realizedProfitLoss).toBe(100);
  expect(result.completedTrades).toBe(3);
 });
 it('keeps symbols isolated',()=>{
  const result=calculatePaperTradingAnalytics([t('BUY',2,100,'ABC'),t('SELL',2,125,'ABC'),t('BUY',1,50,'XYZ')]);
  expect(result.realizedProfitLoss).toBe(50);
 });
 it('rejects an impossible sell or inconsistent ledger value',()=>{
  expect(calculatePaperTradingAnalytics([t('SELL',1,10)]).valid).toBe(false);
  expect(calculatePaperTradingAnalytics([{...t('BUY',1,10),grossValue:99}]).valid).toBe(false);
 });
 it('returns zero metrics for an empty ledger',()=>{
  expect(calculatePaperTradingAnalytics([])).toMatchObject({buyTurnover:0,sellTurnover:0,realizedProfitLoss:0,completedTrades:0,valid:true});
 });
});
