import { useMemo } from 'react';
import { calculateQualityScore, type QualityFactor } from './engine';
import './research-workspaces.css';
const factors:{key:QualityFactor;label:string;description:string;needed:string}[]=[
 {key:'PROFITABILITY',label:'Profitability',description:'Returns and operating margins',needed:'ROE, ROCE, ROIC, operating margin'},
 {key:'GROWTH',label:'Growth',description:'Consistency of revenue and earnings growth',needed:'Revenue, EPS and PAT growth history'},
 {key:'FINANCIAL_HEALTH',label:'Financial health',description:'Leverage and short-term solvency',needed:'Debt, interest cover, current ratio'},
 {key:'CASH_FLOW',label:'Cash flow',description:'Cash conversion and free cash flow',needed:'CFO, PAT, capex and free cash flow'},
 {key:'VALUATION',label:'Valuation',description:'Price relative to earnings, assets and cash flow',needed:'Market price, shares and valuation multiples'},
 {key:'GOVERNANCE_RISK',label:'Governance & risk',description:'Disclosure-backed governance risk checks',needed:'Promoter pledge, filings and verified disclosures'}
];
export default function QualityWorkspace(){
 const result=useMemo(()=>calculateQualityScore([],0.6),[]);
 return <section className="workspace-page"><div className="page-heading"><div><div className="eyebrow muted">EXPLAINABLE RESEARCH FRAMEWORK</div><h1>Business Quality Score</h1><p>A six-factor framework designed to show evidence, coverage and missing inputs—not a black-box rating.</p></div></div>
 <div className="market-disclaimer"><b>Score unavailable — data provider not connected.</b> No score is calculated from placeholder data. A company score will appear only after factor inputs are supported by verified observations and evidence.</div>
 <div className="quality-summary panel"><div><span className="eyebrow muted">CURRENT COVERAGE</span><strong>{Math.round(result.coverage*100)}%</strong><small>{result.status.replaceAll('_',' ')}</small></div><div><span className="eyebrow muted">QUALITY SCORE</span><strong>— / 100</strong><small>Insufficient verified evidence</small></div></div>
 <div className="quality-factor-list">{factors.map((f,i)=><article className="panel quality-factor" key={f.key}><div className="factor-index">0{i+1}</div><div className="factor-copy"><h3>{f.label}</h3><p>{f.description}</p><small>Required evidence: {f.needed}</small></div><span className="factor-unavailable">Not assessed</span></article>)}</div>
 <div className="panel methodology-note"><h3>Methodology & safeguards</h3><ul><li>Six weighted factors, normalized only across available evidence.</li><li>Coverage is disclosed; score is withheld below the minimum coverage threshold.</li><li>Each factor must retain metric definitions, reporting periods, source and validation notes.</li><li>Governance risk requires primary disclosures; it is not inferred from price movements.</li></ul></div>
 </section>;
}
