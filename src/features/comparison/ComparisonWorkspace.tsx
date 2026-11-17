import { useMemo, useState } from 'react';
import { buildComparison } from './engine';
import type { MetricKey, MetricObservation, PeriodType } from '../../platform/data-contracts/types';
import './research-workspaces.css';
const companies=[{id:'DEMO1',name:'Sample Industries Ltd.'},{id:'DEMO2',name:'Illustrative Consumer Co.'},{id:'DEMO3',name:'Example Engineering Ltd.'},{id:'DEMO4',name:'Placeholder Healthcare Ltd.'},{id:'DEMO5',name:'Demo Technology Ltd.'}];
const metrics:MetricKey[]=['REVENUE','PAT','ROE','ROCE','DEBT_TO_EQUITY','FREE_CASH_FLOW','PE','PB'];
const labels:Record<MetricKey,string>={REVENUE:'Revenue',PAT:'Profit after tax',ROE:'Return on equity',ROCE:'Return on capital employed',DEBT_TO_EQUITY:'Debt / equity',FREE_CASH_FLOW:'Free cash flow',PE:'P/E',PB:'P/B'};
export default function ComparisonWorkspace(){
 const [selected,setSelected]=useState<string[]>(['DEMO1','DEMO2']);
 const [period,setPeriod]=useState<PeriodType>('ANNUAL');
 const toggle=(id:string)=>setSelected(old=>old.includes(id)?old.filter(x=>x!==id):old.length<4?[...old,id]:old);
 const observations=useMemo<MetricObservation[]>(()=>[],[]);
 const rows=buildComparison(selected.map(id=>({companyId:id,name:companies.find(c=>c.id===id)?.name??id,observations})),metrics,period);
 return <section className="workspace-page"><div className="page-heading"><div><div className="eyebrow muted">SIDE-BY-SIDE ANALYSIS</div><h1>Compare Companies</h1><p>Choose up to four companies and compare only verified, period-aligned financial observations.</p></div></div>
 <div className="market-disclaimer"><b>Provider not connected.</b> These are placeholder company identities only. No financial figures are fabricated; all unavailable observations are shown as missing.</div>
 <div className="panel compare-controls"><div><b>Companies</b><small>Select 2–4 research profiles</small></div><div className="compare-company-list">{companies.map(c=><label key={c.id}><input type="checkbox" checked={selected.includes(c.id)} onChange={()=>toggle(c.id)} disabled={!selected.includes(c.id)&&selected.length>=4}/><span>{c.name}</span></label>)}</div><label className="period-select">Reporting period<select value={period} onChange={e=>setPeriod(e.target.value as PeriodType)}><option value="ANNUAL">Annual</option><option value="QUARTERLY">Quarterly</option><option value="TTM">TTM</option></select></label></div>
 {selected.length<2?<div className="empty-state"><h2>Select at least two companies</h2><p>Choose another company above to compare.</p></div>:<div className="results-panel comparison-table"><div className="results-top"><div><b>Metric comparison</b><small>Values appear only when verified data for a common period is available</small></div><span className="data-note">{period} · {selected.length} profiles</span></div><div className="table-wrap"><table><thead><tr><th>Metric</th>{selected.map(id=><th key={id}>{companies.find(c=>c.id===id)?.name}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.metric}><td><b>{labels[row.metric]}</b></td>{row.cells.map(cell=><td key={cell.companyId}><span className="missing-value">—</span><small className="cell-status">{cell.status==='MISSING'?'No verified observation':cell.status}</small></td>)}</tr>)}</tbody></table></div></div>}
 </section>;
}
