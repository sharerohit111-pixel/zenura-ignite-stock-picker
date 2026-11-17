import { useMemo } from 'react';
import { calculateQualityScore, type QualityFactor } from './engine';
import '../comparison/research-workspaces.css';
const factors:{key:QualityFactor;label:string;description:string;needed:string}[]=[
 {key:'PROFITABILITY',label:'Profitability',description:'Returns and operating margins',needed:'ROE, ROCE, ROIC, operating margin'},
 {key:'GROWTH',label:'Growth',description:'Consistency of revenue and earnings growth',needed:'Revenue, EPS and PAT growth history'},
 {key:'FINANCIAL_HEALTH',label:'Financial health',description:'Leverage and short-term solvency',needed:'Debt, interest cover, current ratio'},
 {key:'CASH_FLOW',label:'Cash flow',description:'Cash conversion and free cash flow',needed:'CFO, PAT, capex and free cash flow'},
 {key:'VALUATION',label:'Valuation',description:'Price relative to earnings, assets and cash flow',needed:'Market price, shares and valuation multiples'},
 {key:'GOVERNANCE_RISK',label:'Governance & risk',description:'Disclosure-backed governance risk checks',needed:'Promoter pledge, filings and verified disclosures'}
];
export default function QualityWorkspace({language='EN'}:{language?:'EN'|'HI'}){
 const result=useMemo(()=>calculateQualityScore([],0.6),[]);
 return <section className="workspace-page"><div className="page-heading"><div><div className="eyebrow muted">{language==='HI'?'समझाने योग्य रिसर्च फ्रेमवर्क':'EXPLAINABLE RESEARCH FRAMEWORK'}</div><h1>{language==='HI'?'व्यवसाय गुणवत्ता स्कोर':'Business Quality Score'}</h1><p>{language==='HI'?'यह छह-कारक ढांचा साक्ष्य, कवरेज और अनुपलब्ध इनपुट दिखाता है—कोई अपारदर्शी रेटिंग नहीं।':'A six-factor framework designed to show evidence, coverage and missing inputs—not a black-box rating.'}</p></div></div>
 <div className="market-disclaimer"><b>{language==='HI'?'स्कोर उपलब्ध नहीं — डेटा प्रदाता कनेक्ट नहीं है।':'Score unavailable — data provider not connected.'}</b> {language==='HI'?'प्लेसहोल्डर डेटा से स्कोर नहीं निकाला जाता। कंपनी का स्कोर तभी दिखेगा जब कारक इनपुट सत्यापित आँकड़ों और साक्ष्य से समर्थित हों।':'No score is calculated from placeholder data. A company score will appear only after factor inputs are supported by verified observations and evidence.'}</div>
 <div className="quality-summary panel"><div><span className="eyebrow muted">CURRENT COVERAGE</span><strong>{Math.round(result.coverage*100)}%</strong><small>{result.status.replaceAll('_',' ')}</small></div><div><span className="eyebrow muted">QUALITY SCORE</span><strong>— / 100</strong><small>Insufficient verified evidence</small></div></div>
 <div className="quality-factor-list">{factors.map((f,i)=><article className="panel quality-factor" key={f.key}><div className="factor-index">0{i+1}</div><div className="factor-copy"><h3>{f.label}</h3><p>{f.description}</p><small>Required evidence: {f.needed}</small></div><span className="factor-unavailable">Not assessed</span></article>)}</div>
 <div className="panel methodology-note"><h3>Methodology & safeguards</h3><ul><li>Six weighted factors, normalized only across available evidence.</li><li>Coverage is disclosed; score is withheld below the minimum coverage threshold.</li><li>Each factor must retain metric definitions, reporting periods, source and validation notes.</li><li>Governance risk requires primary disclosures; it is not inferred from price movements.</li></ul></div>
 </section>;
}
