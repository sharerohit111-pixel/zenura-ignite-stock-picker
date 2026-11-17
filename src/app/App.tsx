import { useMemo, useState } from 'react';
import {
  Activity, BarChart3, Bookmark, Building2, ChevronDown, CircleHelp, Command,
  Compass, FileText, Filter, Globe2, LayoutDashboard, Search, Settings2,
  ShieldCheck, Sparkles, TrendingUp, Wallet, X, Menu, ArrowUpRight, SlidersHorizontal
} from 'lucide-react';
import './app.css';
import { runScreener, loadSavedScreens, saveScreen, deleteSavedScreen, type ScreenerRule, type ScreenerRow, type SavedScreen } from '../features/screener/engine';
import type { MetricKey } from '../platform/data-contracts/types';
import FinancialStatementsPanel from '../features/company-research/FinancialStatementsPanel';
import DcfCalculator from '../features/valuation/DcfCalculator';
import ComparisonWorkspace from '../features/comparison/ComparisonWorkspace';
import QualityWorkspace from '../features/quality-score/QualityWorkspace';
import ReportsWorkspace from '../features/reports/ReportsWorkspace';
import { exportWatchlistCsv } from '../features/watchlist/export';

type Company = { symbol:string; name:string; sector:string; roe:number; roce:number; pe:number; pb:number; debt:number; sales:number; profit:number; };
const demoCompanies: Company[] = [
  {symbol:'DEMO1',name:'Sample Industries Ltd.',sector:'Industrials',roe:22.4,roce:28.1,pe:24.8,pb:5.2,debt:0.12,sales:18.5,profit:24.2},
  {symbol:'DEMO2',name:'Illustrative Consumer Co.',sector:'Consumer',roe:19.8,roce:25.4,pe:31.2,pb:6.1,debt:0.08,sales:14.2,profit:17.8},
  {symbol:'DEMO3',name:'Example Engineering Ltd.',sector:'Engineering',roe:16.3,roce:21.7,pe:18.6,pb:2.9,debt:0.34,sales:12.7,profit:15.1},
  {symbol:'DEMO4',name:'Placeholder Healthcare Ltd.',sector:'Healthcare',roe:25.1,roce:32.6,pe:42.5,pb:8.4,debt:0.05,sales:21.4,profit:29.6},
  {symbol:'DEMO5',name:'Demo Technology Ltd.',sector:'Technology',roe:13.8,roce:17.2,pe:27.3,pb:3.8,debt:0.21,sales:9.8,profit:11.3},
];

const nav = [
  {label:'Overview',icon:LayoutDashboard},
  {label:'Stock Screener',icon:Filter},
  {label:'Company Research',icon:Building2},
  {label:'Compare Companies',icon:BarChart3},
  {label:'Valuation Lab',icon:TrendingUp},
  {label:'Quality Score',icon:ShieldCheck},
  {label:'Watchlist',icon:Bookmark},
  {label:'Commodities Research',icon:Wallet},
  {label:'Research Reports',icon:FileText},
];

const demoCommodities = [
  {name:'Gold',symbol:'GOLD',group:'Bullion',contract:'Gold Futures',unit:'₹ / 10 g',price:'Demo only',drivers:'USD/INR · global yields · central-bank demand'},
  {name:'Silver',symbol:'SILVER',group:'Bullion',contract:'Silver Futures',unit:'₹ / kg',price:'Demo only',drivers:'Industrial demand · solar · investment flows'},
  {name:'Copper',symbol:'COPPER',group:'Base Metals',contract:'Copper Futures',unit:'₹ / kg',price:'Demo only',drivers:'China demand · inventories · mine supply'},
  {name:'Crude Oil',symbol:'CRUDEOIL',group:'Energy',contract:'Crude Oil Futures',unit:'₹ / barrel',price:'Demo only',drivers:'OPEC+ · inventories · geopolitics'},
  {name:'Natural Gas',symbol:'NATURALGAS',group:'Energy',contract:'Natural Gas Futures',unit:'₹ / mmBtu',price:'Demo only',drivers:'Weather · storage · LNG flows'},
  {name:'Cotton',symbol:'COTTON',group:'Agriculture',contract:'Cotton Futures',unit:'₹ / bale',price:'Demo only',drivers:'Crop estimates · textile demand · exports'},
  {name:'Jeera',symbol:'JEERA',group:'Agriculture',contract:'Jeera Futures',unit:'₹ / quintal',price:'Demo only',drivers:'Sowing · arrivals · weather · exports'},
];

function Metric({label,value,sub}:{label:string,value:string,sub:string}) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong><small>{sub}</small></div>;
}

export default function App() {
  const [active,setActive] = useState('Overview');
  const [language,setLanguage] = useState<'EN'|'HI'>(() => {
    try { return localStorage.getItem('zi-language') === 'HI' ? 'HI' : 'EN'; } catch { return 'EN'; }
  });
  const [query,setQuery] = useState('');
  const [globalSearch,setGlobalSearch] = useState('');
  const [commodityGroup,setCommodityGroup] = useState('All');
  const [minRoe,setMinRoe] = useState('15');
  const [minRoce,setMinRoce] = useState('0');
  const [maxPe,setMaxPe] = useState('35');
  const [maxPb,setMaxPb] = useState('999');
  const [maxDebt,setMaxDebt] = useState('0.5');
  const [savedScreens,setSavedScreens] = useState<SavedScreen[]>(() => loadSavedScreens());
  const [screenName,setScreenName] = useState('');
  const [sortMetric,setSortMetric] = useState<MetricKey|'NAME'>('NAME');
  const [sortDirection,setSortDirection] = useState<'ASC'|'DESC'>('DESC');
  const [watchlist,setWatchlist] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('zi-watchlist') || '[]') as string[]; } catch { return []; }
  });
  type WatchlistResearch = { status:'To review'|'Researching'|'Completed'; notes:string };
  const [watchlistResearch,setWatchlistResearch] = useState<Record<string,WatchlistResearch>>(() => {
    try { return JSON.parse(localStorage.getItem('zi-watchlist-research') || '{}') as Record<string,WatchlistResearch>; } catch { return {}; }
  });
  const updateWatchlistResearch = (symbol:string, patch:Partial<WatchlistResearch>) => setWatchlistResearch(prev => {
    const next = {...prev,[symbol]:{status:prev[symbol]?.status || 'To review',notes:prev[symbol]?.notes || '',...patch}};
    try { localStorage.setItem('zi-watchlist-research',JSON.stringify(next)); } catch {}
    return next;
  });
  const [searchOpen,setSearchOpen] = useState(false);
  const [theme,setTheme] = useState<'dark'|'light'>(() => {
    try { return localStorage.getItem('zi-theme') === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
  });
  const [selected,setSelected] = useState<Company|null>(null);
  const [researchCompany,setResearchCompany] = useState<Company|null>(null);
  const [mobileNav,setMobileNav] = useState(false);
  const [showFilters,setShowFilters] = useState(true);

  const demoRows = useMemo<ScreenerRow[]>(()=>demoCompanies.map(c=>({
    company:{companyId:c.symbol,name:c.name,symbol:c.symbol,sector:c.sector,identityStatus:'PROVISIONAL'},
    observations:([
      ['ROE',c.roe,'PERCENT'],['ROCE',c.roce,'PERCENT'],['PE',c.pe,'MULTIPLE'],['PB',c.pb,'MULTIPLE'],['DEBT_TO_EQUITY',c.debt,'RATIO']
    ] as [MetricKey,number,'PERCENT'|'MULTIPLE'|'RATIO'][]).map(([metricKey,value,unit])=>({
      observationId:`${c.symbol}-${metricKey}`,companyId:c.symbol,metricKey,value,unit,periodType:'ANNUAL',periodEnd:'2025-03-31',sourceId:'DEMO',sourceRetrievedAt:'2026-11-17T00:00:00.000Z',ingestedAt:'2026-11-17T00:00:00.000Z',status:'UNVERIFIED'
    }))
  })),[]);
  const activeRules = useMemo<ScreenerRule[]>(()=>[
    {metric:'ROE',operator:'GTE',value:Number(minRoe||0)},
    {metric:'ROCE',operator:'GTE',value:Number(minRoce||0)},
    {metric:'PE',operator:'LTE',value:Number(maxPe||9999)},
    {metric:'PB',operator:'LTE',value:Number(maxPb||9999)},
    {metric:'DEBT_TO_EQUITY',operator:'LTE',value:Number(maxDebt||9999)}
  ],[minRoe,minRoce,maxPe,maxPb,maxDebt]);
  const screenerResult = useMemo(()=>runScreener(demoRows,{rules:activeRules,search:query,sortBy:sortMetric==='NAME'?undefined:sortMetric,sortDirection}),[demoRows,activeRules,query,sortMetric,sortDirection]);
  const filtered = screenerResult.rows.map(row=>demoCompanies.find(c=>c.symbol===row.company.symbol)!).filter(Boolean);

  const toggleLanguage = () => setLanguage(prev => {
    const next = prev === 'EN' ? 'HI' : 'EN';
    try { localStorage.setItem('zi-language', next); } catch {}
    return next;
  });
  const toggleWatchlist = (symbol:string) => setWatchlist(prev => {
    const next = prev.includes(symbol) ? prev.filter(x=>x!==symbol) : [...prev,symbol];
    try { localStorage.setItem('zi-watchlist', JSON.stringify(next)); } catch {}
    return next;
  });
  const toggleTheme = () => setTheme(prev => {
    const next = prev === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('zi-theme', next); } catch {}
    return next;
  });
  const title = language==='HI' ? 'व्यवसाय को समझें।\\nमूल्य को परखें।' : 'See the business.\\nUnderstand the value.';
  const choose = (label:string) => {setActive(label);setMobileNav(false);setSelected(null);setGlobalSearch('');setSearchOpen(false);};
  const globalMatches = [...demoCompanies.map(c=>({label:c.name,meta:`${c.symbol} · ${c.sector}`,target:'Company Research',company:c})),...demoCommodities.map(c=>({label:c.name,meta:`${c.symbol} · ${c.group}`,target:'Commodities Research',company:null}))].filter(x=>(x.label+' '+x.meta).toLowerCase().includes(globalSearch.toLowerCase())).slice(0,7);
  const openGlobalMatch = (match:typeof globalMatches[number]) => { if(match.company) setResearchCompany(match.company); choose(match.target); };
  const openCompanyResearch = (company:Company) => { setResearchCompany(company); setSelected(null); setActive('Company Research'); setMobileNav(false); }; 

  return <div className={`shell ${theme==='light'?'light-theme':''}`}>
    <aside className={mobileNav?'sidebar mobile-open':'sidebar'}>
      <div className="brand"><div className="brand-mark"><Activity size={22}/></div><div><strong>ZENURA <span>IGNITE</span></strong><small>STOCK PICKER</small></div><button className="mobile-close" onClick={()=>setMobileNav(false)}><X size={18}/></button></div>
      <div className="workspace-label">{language==='HI'?'रिसर्च कार्यक्षेत्र':'RESEARCH WORKSPACE'}</div>
      <nav>{nav.map(item=><button key={item.label} className={active===item.label?'nav-item active':'nav-item'} onClick={()=>choose(item.label)}><item.icon size={18}/><span>{language==='HI'?({'Overview':'अवलोकन','Stock Screener':'स्टॉक स्क्रीनर','Company Research':'कंपनी रिसर्च','Compare Companies':'कंपनियों की तुलना','Valuation Lab':'मूल्यांकन लैब','Quality Score':'गुणवत्ता स्कोर','Watchlist':'वॉचलिस्ट','Commodities Research':'कमोडिटी रिसर्च','Research Reports':'रिसर्च रिपोर्ट'} as Record<string,string>)[item.label] || item.label:item.label}</span></button>)}</nav>
      <div className="sidebar-bottom">
        <div className="trust-card"><ShieldCheck size={18}/><div><b>Research you can verify</b><small>Source-led. Period-aware. Transparent.</small></div></div>
        <button className="nav-item" onClick={()=>choose('Settings')}><Settings2 size={18}/>Settings</button>
        <button className="nav-item" onClick={()=>choose('Help & support')}><CircleHelp size={18}/>Help & support</button>
        <div className="profile"><div className="avatar">RK</div><div><b>Rohit Kumar</b><small>Founder & Developer</small></div><ChevronDown size={15}/></div>
      </div>
    </aside>
    {mobileNav && <button className="scrim" onClick={()=>setMobileNav(false)} aria-label="Close navigation"/>}
    <main className="main">
      <header className="topbar"><div className="top-left"><button className="mobile-menu" onClick={()=>setMobileNav(true)}><Menu size={19}/></button><div className="crumb">{language==='HI'?'कार्यस्थल':'Workspace'} <span>/</span> <b>{language==='HI'?({'Overview':'अवलोकन','Stock Screener':'स्टॉक स्क्रीनर','Company Research':'कंपनी रिसर्च','Compare Companies':'कंपनियों की तुलना','Valuation Lab':'मूल्यांकन लैब','Quality Score':'गुणवत्ता स्कोर','Watchlist':'वॉचलिस्ट','Commodities Research':'कमोडिटी रिसर्च','Research Reports':'रिसर्च रिपोर्ट','Settings':'सेटिंग्स','Help & support':'सहायता'} as Record<string,string>)[active] || active:active}</b></div></div><div className="top-actions"><div className="global-search"><Search size={16}/><input aria-label="Search companies and commodities" value={globalSearch} onFocus={()=>setSearchOpen(true)} onChange={e=>{setGlobalSearch(e.target.value);setSearchOpen(true);}} onKeyDown={e=>{if(e.key==='Escape'){setGlobalSearch('');setSearchOpen(false);} if(e.key==='Enter' && globalMatches[0]){openGlobalMatch(globalMatches[0]);setSearchOpen(false);}}} placeholder={language==='HI'?'कंपनी या कमोडिटी खोजें':'Search companies, symbols, ISIN...'}/>{searchOpen && globalSearch && <div className="search-popover">{globalMatches.length?globalMatches.map((m,i)=><button key={i} onClick={()=>{openGlobalMatch(m);setSearchOpen(false);}}><b>{m.label}</b><small>{m.meta}</small></button>):<small>No matching entries. Exchange master search is not connected yet.</small>}</div>}</div><button className="lang" onClick={toggleLanguage}><Globe2 size={15}/>{language}<ChevronDown size={13}/></button><button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">{theme==='dark'?'☀':'☾'}</button><div className="avatar small">RK</div></div></header>

      {active==='Overview' && <>
        <section className="welcome"><div><div className="eyebrow"><span className="pulse"/> {language==='HI'?'मौलिक विश्लेषण मंच':'FUNDAMENTAL RESEARCH PLATFORM'}</div><h1>{title.split('\\n')[0]}<br/><em>{title.split('\\n')[1]}</em></h1><p>{language==='HI'?'पारदर्शी वित्तीय आँकड़ों, स्पष्ट मूल्यांकन और सत्यापित रिसर्च के आधार पर मजबूत कंपनियों को समझें।':'Discover financially resilient companies with transparent fundamentals, clear valuation context, and research you can verify.'}</p><div className="welcome-actions"><button className="primary" onClick={()=>choose('Stock Screener')}><Compass size={17}/> {language==='HI'?'स्टॉक स्क्रीनर देखें':'Explore Stock Screener'}</button><button className="secondary" onClick={()=>choose('Company Research')}>{language==='HI'?'कंपनी का विश्लेषण करें':'Research a company'} <span>↗</span></button></div></div><div className="orb-wrap"><div className="orb"><div className="orb-core"><TrendingUp size={42}/></div><span className="orbit o1"/><span className="orbit o2"/><span className="orb-dot d1"/><span className="orb-dot d2"/></div><div className="orb-caption">FUNDAMENTALS <b>·</b> QUALITY <b>·</b> VALUE</div></div></section>
        <div className="section-head"><div><div className="eyebrow muted">YOUR RESEARCH DESK</div><h2>Start with a clear view</h2></div><span className="data-note"><ShieldCheck size={14}/> {language==='HI'?'डेमो कार्यक्षेत्र · डेटा प्रदाता जुड़ा नहीं है':'Demo workspace · No provider connected'}</span></div>
        <section className="quick-grid">
          <button className="feature-card" onClick={()=>choose('Stock Screener')}><div className="feature-icon cyan"><Filter size={20}/></div><div className="card-arrow">↗</div><h3>Fundamental Screener</h3><p>Build precise screens using profitability, growth, leverage, and valuation metrics.</p><div className="card-foot">CUSTOM FILTERS <span>→</span></div></button>
          <button className="feature-card" onClick={()=>choose('Company Research')}><div className="feature-icon violet"><Building2 size={20}/></div><div className="card-arrow">↗</div><h3>Company Research</h3><p>Explore financial statements, key ratios, business quality, and risk signals.</p><div className="card-foot">DEEP DIVE <span>→</span></div></button>
          <button className="feature-card" onClick={()=>choose('Compare Companies')}><div className="feature-icon blue"><BarChart3 size={20}/></div><div className="card-arrow">↗</div><h3>Compare Companies</h3><p>Compare businesses side by side with consistent periods and definitions.</p><div className="card-foot">SIDE BY SIDE <span>→</span></div></button>
        </section>
        <section className="bottom-grid"><div className="panel"><div className="panel-title"><div><span className="eyebrow muted">RESEARCH FRAMEWORK</span><h3>What makes a quality business?</h3></div><Sparkles size={19}/></div><div className="pill-row"><span>Profitability</span><span>Growth</span><span>Financial health</span><span>Cash flow</span><span>Valuation</span><span>Governance</span></div><p className="panel-copy">Our quality score will explain each factor, show underlying figures, and flag missing or stale information. No unexplained black-box ratings.</p></div><div className="panel status-panel"><div className="panel-title"><div><span className="eyebrow muted">PLATFORM STATUS</span><h3>Built for trust</h3></div><ShieldCheck size={19}/></div><div className="status-line"><span className="status-dot"/> Financial data provider <b>Not connected</b></div><div className="status-line"><span className="status-dot"/> Ads framework <b>Disabled</b></div><div className="status-line"><span className="status-dot"/> Subscription framework <b>Disabled</b></div></div></section>
      </>}

      {active==='Stock Screener' && <section className="workspace-page">
        <div className="page-heading"><div><div className="eyebrow muted">{language==='HI'?'कंपनियाँ खोजें':'DISCOVER COMPANIES'}</div><h1>{language==='HI'?'फंडामेंटल स्क्रीनर':'Fundamental Screener'}</h1><p>{language==='HI'?'व्यवसाय गुणवत्ता, विकास, वित्तीय मजबूती और मूल्यांकन के आधार पर कंपनियाँ छाँटें।':'Filter companies by business quality, growth, financial strength, and valuation.'}</p></div><button className="secondary" onClick={()=>setShowFilters(!showFilters)}><SlidersHorizontal size={16}/> {showFilters?(language==='HI'?'फ़िल्टर छिपाएँ':'Hide filters'):(language==='HI'?'फ़िल्टर दिखाएँ':'Show filters')}</button></div>
        <div className="demo-warning"><ShieldCheck size={16}/><span><b>{language==='HI'?'केवल प्रोटोटाइप डेटा।':'Prototype data only.'}</b> {language==='HI'?'नीचे की पंक्तियाँ उदाहरण हैं, वास्तविक सूचीबद्ध कंपनियाँ या निवेश जानकारी नहीं।':'The rows below are illustrative examples, not real listed companies or investment information.'}</span></div>
        <div className="screen-layout">
          {showFilters && <aside className="filter-panel"><div className="panel-title"><h3><Filter size={16}/> {language==='HI'?'फ़िल्टर':'Filters'}</h3><button className="text-btn" onClick={()=>{setMinRoe('0');setMinRoce('0');setMaxPe('999');setMaxPb('999');setMaxDebt('999');setQuery('');}}>{language==='HI'?'रीसेट':'Reset'}</button></div>
            <label>{language==='HI'?'कंपनी खोजें':'Search company'}<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="{language==='HI'?'नाम, सिंबल या सेक्टर':'Name, symbol or sector'}"/></label>
            <label>{language==='HI'?'न्यूनतम ROE (%)':'Minimum ROE (%)'}<input type="number" min="0" value={minRoe} onChange={e=>setMinRoe(e.target.value)}/></label>
            <label>{language==='HI'?'न्यूनतम ROCE (%)':'Minimum ROCE (%)'}<input type="number" min="0" value={minRoce} onChange={e=>setMinRoce(e.target.value)}/></label>
            <label>{language==='HI'?'अधिकतम P/E अनुपात':'Maximum P/E ratio'}<input type="number" min="0" value={maxPe} onChange={e=>setMaxPe(e.target.value)}/></label>
            <label>{language==='HI'?'अधिकतम P/B अनुपात':'Maximum P/B ratio'}<input type="number" min="0" value={maxPb} onChange={e=>setMaxPb(e.target.value)}/></label>
            <label>{language==='HI'?'अधिकतम ऋण / इक्विटी':'Maximum Debt / Equity'}<input type="number" min="0" step="0.05" value={maxDebt} onChange={e=>setMaxDebt(e.target.value)}/></label>
            <label>{language==='HI'?'वर्तमान स्क्रीन सेव करें':'Save current screen'}<input value={screenName} onChange={e=>setScreenName(e.target.value)} placeholder="{language==='HI'?'उचित मूल्य पर गुणवत्ता':'e.g. Quality at fair value'}"/></label>
            <button className="secondary compact" disabled={!screenName.trim()} onClick={()=>{const item:SavedScreen={id:`screen-${Date.now()}`,name:screenName.trim(),rules:activeRules,search:query,updatedAt:new Date().toISOString()};setSavedScreens(saveScreen(item));setScreenName('');}}>{language==='HI'?'स्क्रीन सेव करें':'Save screen'}</button>
            <div className="filter-note">Filters run through the provider-neutral screener engine. Prototype observations are unverified and illustrative only.</div>
            {savedScreens.length>0 && <div className="saved-screen-list"><b>{language==='HI'?'सेव की गई स्क्रीन':'Saved screens'}</b>{savedScreens.map(item=><div className="saved-screen-item" key={item.id}><button className="text-btn" onClick={()=>{setQuery(item.search);const value=(metric:MetricKey,fallback:number)=>item.rules.find(r=>r.metric===metric)?.value??fallback;setMinRoe(String(value('ROE',0)));setMinRoce(String(value('ROCE',0)));setMaxPe(String(value('PE',999)));setMaxPb(String(value('PB',999)));setMaxDebt(String(value('DEBT_TO_EQUITY',999)));}}>{item.name}</button><button className="text-btn danger" aria-label={`Delete ${item.name}`} onClick={()=>setSavedScreens(deleteSavedScreen(item.id))}>×</button></div>)}</div>}
          </aside>}
          <div className="results-panel"><div className="results-top"><div><b>{filtered.length} {language==='HI'?'उदाहरण परिणाम':'illustrative results'}</b><small>Engine filtered · Demo dataset · Unverified observations</small></div><div className="sort-controls"><select aria-label="Sort metric" value={sortMetric} onChange={e=>setSortMetric(e.target.value as MetricKey|'NAME')}><option value="NAME">{language==='HI'?'कंपनी का नाम':'Company name'}</option><option value="ROE">ROE</option><option value="ROCE">ROCE</option><option value="PE">P/E</option><option value="PB">P/B</option><option value="DEBT_TO_EQUITY">Debt / Equity</option></select><button className="secondary compact" onClick={()=>setSortDirection(v=>v==='ASC'?'DESC':'ASC')}>{sortDirection==='ASC'?'language==='HI'?(sortDirection==='ASC'?'आरोही':'अवरोही'):(sortDirection==='ASC'?'Ascending':'Descending')}</button></div></div>
            <div className="table-wrap"><table><thead><tr><th>Company</th><th>ROE</th><th>ROCE</th><th>P/E</th><th>P/B</th><th>Debt/Eq.</th><th></th></tr></thead><tbody>{filtered.map(c=><tr key={c.symbol}><td><button className="company-link" onClick={()=>setSelected(c)}><b>{c.name}</b><small>{c.symbol} · {c.sector}</small></button></td><td>{c.roe.toFixed(1)}%</td><td>{c.roce.toFixed(1)}%</td><td>{c.pe.toFixed(1)}</td><td>{c.pb.toFixed(1)}</td><td>{c.debt.toFixed(2)}</td><td><button className={watchlist.includes(c.symbol)?'save-btn saved':'save-btn'} onClick={()=>toggleWatchlist(c.symbol)} aria-label="Toggle watchlist"><Bookmark size={16} fill={watchlist.includes(c.symbol)?'currentColor':'none'}/></button></td></tr>)}</tbody></table></div>
            {filtered.length===0 && <div className="empty">{language==='HI'?'इन फ़िल्टर से कोई उदाहरण कंपनी मेल नहीं खाती। मानदंड थोड़े आसान करें।':'No illustrative companies match these filters. Try relaxing the criteria.'}</div>}<div className="filter-note">{screenerResult.excludedForIdentity} excluded for identity · {screenerResult.excludedForData} missing-data rule failures. No real securities or verified financial data are included.</div>
          </div>
        </div>
      </section>}

      {active==='Commodities Research' && <section className="workspace-page">
        <div className="page-heading"><div><div className="eyebrow muted">{language==='HI'?'बहु-परिसंपत्ति रिसर्च':'MULTI-ASSET RESEARCH'}</div><h1>{language==='HI'?'कमोडिटी रिसर्च':'Commodities Research'}</h1><p>{language==='HI'?'बुलियन, बेस मेटल, ऊर्जा और कृषि कमोडिटी बाजारों का अध्ययन करें।':'Explore bullion, base metals, energy and agricultural commodity markets.'}</p></div></div>
        <div className="market-disclaimer"><b>{language==='HI'?'प्रोटोटाइप / लाइव मार्केट फीड नहीं:':'Prototype / no live market feed:'}</b> {language==='HI'?'कीमतें, प्रतिशत बदलाव और कॉन्ट्रैक्ट उपलब्धता के लिए काल्पनिक आँकड़े नहीं भरे गए हैं। लाइव भाव दिखाने से पहले अधिकृत एक्सचेंज डेटा प्रदाता जोड़ें।':'Prices, percentage moves and contract availability are intentionally not populated with invented market values. Connect an authorized exchange data provider before showing live quotes.'}</div>
        <div className="commodity-tabs">{['All','Bullion','Base Metals','Energy','Agriculture'].map(g=><button key={g} className={commodityGroup===g?'active':''} onClick={()=>setCommodityGroup(g)}>{g}</button>)}</div>
        <div className="commodity-grid">{demoCommodities.filter(c=>commodityGroup==='All'||c.group===commodityGroup).map(c=><article className="commodity-card" key={c.symbol}><div className="kind">{c.group}</div><h3>{c.name}</h3><small>{c.symbol} · {c.contract}</small><div className="fake-price">{c.price}</div><div className="muted-note">Indicative unit: {c.unit} · No live quote</div><div className="commodity-details"><div><small>Live quote</small><b>Unavailable</b></div><div><small>Contract status</small><b>Verify exchange</b></div><div><small>Research coverage</small><b>Planned</b></div></div><p className="panel-copy"><b>Key market drivers</b><br/>{c.drivers}</p></article>)}</div>
        <div className="panel" style={{marginTop:16}}><div className="panel-title"><div><span className="eyebrow muted">RESEARCH TOOLKIT</span><h3>Analysis modules planned</h3></div><Sparkles size={19}/></div><div className="pill-row"><span>Price history</span><span>Technical indicators</span><span>Support / Resistance</span><span>Futures curve</span><span>Options chain</span><span>Volume & OI</span><span>Seasonality</span><span>Global benchmarks</span><span>Currency impact</span><span>AI research</span><span>Price alerts</span></div><p className="panel-copy">Contract specifications, expiry dates, lot sizes and options data will be sourced from verified exchange/provider feeds. Availability can vary by exchange and contract.</p></div>
      </section>}

      {active==='Company Research' && <section className="workspace-page"><div className="page-heading"><div><div className="eyebrow muted">{language==='HI'?'व्यवसाय का विस्तृत विश्लेषण':'BUSINESS DEEP DIVE'}</div><h1>{language==='HI'?'कंपनी रिसर्च':'Company Research'}</h1><p>{language==='HI'?'वित्तीय मजबूती, परिचालन प्रदर्शन और मूल्यांकन की एक ही जगह समीक्षा करें।':'Review financial strength, operating performance, and valuation in one place.'}</p></div><select aria-label="Choose illustrative company" value={researchCompany?.symbol ?? ''} onChange={e=>setResearchCompany(demoCompanies.find(c=>c.symbol===e.target.value) ?? null)}><option value="">Select a demo company</option>{demoCompanies.map(c=><option key={c.symbol} value={c.symbol}>{c.name} ({c.symbol})</option>)}</select></div>{researchCompany && <div className="panel research-company-card"><div><span className="eyebrow muted">ILLUSTRATIVE COMPANY PROFILE</span><h2>{researchCompany.name}</h2><p>{researchCompany.symbol} · {researchCompany.sector}</p></div><div className="demo-warning"><ShieldCheck size={16}/> Demo identity only · No verified exchange listing</div><button className="secondary compact" onClick={()=>setResearchCompany(null)}>Clear selection</button></div>}<div className="market-disclaimer"><b>{language==='HI'?'डेटा प्रदाता कनेक्ट नहीं है:':'Data provider not connected:'}</b> {language==='HI'?'इस वर्कस्पेस में वास्तविक कंपनी वित्तीय विवरण नहीं हैं। वित्तीय आँकड़े दिखाने से पहले स्वीकृत स्रोत जोड़ें।':'This workspace does not contain real company financial statements. Connect an approved source before displaying financial values.'}</div><FinancialStatementsPanel /><div className="panel" style={{marginTop:16}}><div className="panel-title"><div><span className="eyebrow muted">DATA INTEGRITY</span><h3>Source and freshness audit</h3></div><ShieldCheck size={19}/></div><p className="panel-copy">Each imported observation must retain provider, dataset, reporting period, unit, retrieval timestamp, licence status and validation result. Stale, unverified or incomplete observations must remain clearly labelled.</p><button className="secondary" onClick={()=>choose('Stock Screener')}>Browse illustrative screener examples</button></div></section>}
      {active==='Valuation Lab' && <DcfCalculator language={language} />}
      {active==='Quality Score' && <QualityWorkspace language={language} />}
      {active==='Research Reports' && <ReportsWorkspace language={language} />}
      {active==='Compare Companies' && <ComparisonWorkspace language={language} />}
      {active==='Watchlist' && <section className="workspace-page"><div className="page-heading"><div><div className="eyebrow muted">YOUR SAVED RESEARCH</div><h1>Watchlist</h1><p>Saved locally in this browser on this device.</p></div><div className="welcome-actions"><button className="secondary" onClick={()=>exportWatchlistCsv(demoCompanies.filter(c=>watchlist.includes(c.symbol)).map(({name,symbol,sector,roe,pe})=>({name,symbol,sector,roe,pe,status:watchlistResearch[symbol]?.status || 'To review',notes:watchlistResearch[symbol]?.notes || ''})))} disabled={!watchlist.length}>Export CSV</button><button className="secondary" onClick={()=>{setWatchlist([]);try{localStorage.removeItem('zi-watchlist')}catch{}}} disabled={!watchlist.length}>Clear watchlist</button></div></div><div className="results-panel"><div className="results-top"><div><b>{watchlist.length} saved demo companies</b><small>Illustrative symbols only · Local storage</small></div></div>{watchlist.length ? <div className="table-wrap"><table><thead><tr><th>Company</th><th>Sector</th><th>ROE</th><th>P/E</th><th>Research status</th><th>My notes</th><th></th></tr></thead><tbody>{demoCompanies.filter(c=>watchlist.includes(c.symbol)).map(c=><tr key={c.symbol}><td><button className="company-link" onClick={()=>setSelected(c)}><b>{c.name}</b><small>{c.symbol}</small></button></td><td>{c.sector}</td><td>{c.roe}%</td><td>{c.pe}</td><td><select aria-label={`Research status for ${c.symbol}`} value={watchlistResearch[c.symbol]?.status || 'To review'} onChange={e=>updateWatchlistResearch(c.symbol,{status:e.target.value as WatchlistResearch['status']})}><option>To review</option><option>Researching</option><option>Completed</option></select></td><td><textarea aria-label={`Research notes for ${c.symbol}`} rows={2} value={watchlistResearch[c.symbol]?.notes || ''} onChange={e=>updateWatchlistResearch(c.symbol,{notes:e.target.value})} placeholder="Add your research notes..." /></td><td><button className="save-btn saved" onClick={()=>toggleWatchlist(c.symbol)} aria-label="Remove from watchlist"><Bookmark size={16} fill="currentColor"/></button></td></tr>)}</tbody></table></div> : <div className="empty">Your watchlist is empty. Save a company from the screener to see it here.</div>}</div></section>}
      {active==='Settings' && <section className="workspace-page"><div className="page-heading"><div><div className="eyebrow muted">{language==='HI'?'व्यक्तिगत प्राथमिकताएँ':'PERSONAL PREFERENCES'}</div><h1>{language==='HI'?'सेटिंग्स':'Settings'}</h1><p>{language==='HI'?'इस डिवाइस पर रिसर्च वर्कस्पेस का रूप और व्यवहार चुनें।':'Choose how the research workspace looks and behaves on this device.'}</p></div></div><div className="panel settings-panel"><div className="setting-row"><div><b>Language / भाषा</b><small>{language==='HI'?'इंटरफ़ेस की भाषा चुनें। हिंदी अनुवाद का काम जारी है।':'Choose the interface language preference. Full-page Hindi translation is still being built.'}</small></div><button className="secondary" onClick={toggleLanguage}>{language==='EN'?'English · Switch to हिंदी':'हिंदी · Switch to English'}</button></div><div className="setting-row"><div><b>Appearance</b><small>{language==='HI'?'डार्क और लाइट थीम के बीच बदलें।':'Change between dark and light workspace themes.'}</small></div><button className="secondary" onClick={toggleTheme}>{theme==='dark'?'Switch to Light':'Switch to Dark'}</button></div><div className="setting-row"><div><b>Saved watchlist</b><small>{watchlist.length} illustrative companies saved on this device.</small></div><button className="secondary" onClick={()=>choose('Watchlist')}>{language==='HI'?'वॉचलिस्ट खोलें':'Open watchlist'}</button></div></div></section>}
      {active==='Help & support' && <section className="workspace-page"><div className="empty-state"><div className="empty-icon"><CircleHelp size={26}/></div><h2>Help & support</h2><p>ZENURA IGNITE STOCK PICKER is currently a prototype. Market data, account support and AI research services are not connected yet.</p><button className="primary" onClick={()=>choose('Overview')}>Back to overview</button></div></section>}
      {!['Overview','Stock Screener','Company Research','Compare Companies','Valuation Lab','Quality Score','Watchlist','Commodities Research','Research Reports','Settings','Help & support'].includes(active) && <section className="workspace-page"><div className="empty-state"><div className="empty-icon"><Settings2 size={26}/></div><h2>{active}</h2><p>This section is reserved for the next development milestone.</p><button className="primary" onClick={()=>choose('Overview')}>Back to overview</button></div></section>}
      <button className="back-top" onClick={()=>window.scrollTo({top:0,behavior:'smooth'})} aria-label="Back to top">↑</button>
      <footer><span>Developed by <b>Rohit Kumar</b></span><span>A ZENURA IGNITE Technologies Product</span><span>Research, not investment advice.</span></footer>
    </main>
    {selected && <div className="modal-backdrop" onClick={()=>setSelected(null)}><div className="company-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setSelected(null)}><X size={18}/></button><div className="eyebrow muted">ILLUSTRATIVE COMPANY PROFILE</div><h2>{selected.name}</h2><p className="modal-sub">{selected.symbol} · {selected.sector}</p><div className="metric-grid"><Metric label="ROE" value={`${selected.roe}%`} sub="Illustrative value"/><Metric label="ROCE" value={`${selected.roce}%`} sub="Illustrative value"/><Metric label="P/E" value={`${selected.pe}`} sub="Illustrative value"/><Metric label="P/B" value={`${selected.pb}`} sub="Illustrative value"/><Metric label="Debt / Equity" value={`${selected.debt}`} sub="Illustrative value"/><Metric label="Sales growth" value={`${selected.sales}%`} sub="Illustrative value"/></div><div className="demo-warning"><ShieldCheck size={16}/> Sample only. Not a real security profile or financial data.</div><button className="primary" style={{marginTop:14}} onClick={()=>openCompanyResearch(selected)}>Open Research Workspace <ArrowUpRight size={15}/></button></div></div>}
  </div>;
}
