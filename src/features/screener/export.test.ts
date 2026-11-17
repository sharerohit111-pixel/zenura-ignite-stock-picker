import { describe, expect, it } from 'vitest';
import { buildScreenerCsv } from './export';

describe('buildScreenerCsv', () => {
  it('exports only supplied filtered rows with explicit data status', () => {
    const csv = buildScreenerCsv([{name:'Sample Industries Ltd.',symbol:'DEMO1',sector:'Industrials',roe:22.4,roce:28.1,pe:24.8,pb:5.2,debtToEquity:0.12,dataStatus:'Unverified demo'}]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"Company","Symbol","Sector"');
    expect(csv).toContain('"Unverified demo"');
    expect(csv).toContain('"DEMO1"');
  });

  it('escapes quotes and neutralizes formula-like text', () => {
    const csv = buildScreenerCsv([{name:'=HYPERLINK("https://bad.example")',symbol:'+CMD',sector:'@sector',roe:1,roce:2,pe:3,pb:4,debtToEquity:0,dataStatus:'Unverified demo'}]);
    expect(csv).toContain('"\'=HYPERLINK(""https://bad.example"")"');
    expect(csv).toContain('"\'+CMD"');
    expect(csv).toContain('"\'@sector"');
  });
});
