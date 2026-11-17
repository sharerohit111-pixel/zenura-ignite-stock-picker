import { describe, expect, it } from 'vitest';
import { buildWatchlistCsv } from './export';

describe('buildWatchlistCsv', () => {
  it('exports a UTF-8 BOM and quoted columns with escaped quotes', () => {
    const csv = buildWatchlistCsv([{name:'Acme "India"',symbol:'ACME',sector:'Industrials',roe:12.5,pe:18,status:'Researching',notes:'Long term'}]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"Acme ""India"""');
    expect(csv).toContain('"Researching"');
  });

  it('neutralizes formula-like user text without changing numeric values', () => {
    const csv = buildWatchlistCsv([{name:'=HYPERLINK("https://bad.example","open")',symbol:'+CMD',sector:'@sector',roe:-2,pe:0,status:'To review',notes:'\t=1+1'}]);
    expect(csv).toContain('"\'=HYPERLINK');
    expect(csv).toContain('"\' +CMD"'.replace(' ', ''));
    expect(csv).toContain('"\'@sector"');
    expect(csv).toContain('"-2"');
    expect(csv).toContain('"0"');
    expect(csv).toContain('"\'\t=1+1"');
  });
});
