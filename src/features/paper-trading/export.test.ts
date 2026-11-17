import { describe, expect, it } from 'vitest';
import { createPaperTradesCsv } from './export';
import type { PaperTrade } from './engine';

const trade: PaperTrade = { id: 'paper-1', symbol: 'TCS', side: 'BUY', quantity: 2, price: 100, grossValue: 200, executedAt: '2026-11-17T10:00:00.000Z' };
describe('paper trade CSV export', () => {
  it('exports headers and trade rows', () => {
    const csv = createPaperTradesCsv([trade]);
    expect(csv).toContain('"Trade ID","Executed At","Symbol","Side"');
    expect(csv).toContain('"paper-1","2026-11-17T10:00:00.000Z","TCS","BUY","2","100","200"');
  });
  it('escapes quotes and protects spreadsheet formulas', () => {
    const csv = createPaperTradesCsv([{ ...trade, id: '=HYPERLINK("x")', symbol: 'ABC, LTD' }]);
    expect(csv).toContain(`"${"'"}=HYPERLINK(""x"")"`);
    expect(csv).toContain('"ABC, LTD"');
  });
  it('exports a header-only file for an empty history', () => {
    expect(createPaperTradesCsv([]).split('\r\n')).toHaveLength(1);
  });
});
