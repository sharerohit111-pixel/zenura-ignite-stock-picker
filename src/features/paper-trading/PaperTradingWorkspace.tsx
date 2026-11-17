import { useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, RotateCcw, ShieldAlert, Wallet } from 'lucide-react';
import { createPaperPortfolio, placePaperOrder, valuePaperPortfolio, type PaperPortfolio } from './engine';
import { loadPaperPortfolio, PAPER_PORTFOLIO_STORAGE_KEY } from './storage';
import { removePaperTrade } from './ledger';
import { filterPaperTradesByDate } from './history';
import { downloadPaperTradesCsv } from './export';
import { calculatePaperTradingAnalytics } from './analytics';
import { createPaperPortfolioBackup, downloadPaperPortfolioBackup, parsePaperPortfolioBackup } from './backup';
import './paper-trading.css';

const money = (value:number) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(value);
const loadResult = () => loadPaperPortfolio(localStorage);

export default function PaperTradingWorkspace({language}:{language:'EN'|'HI'}) {
  const hi = language === 'HI';
  const [initialLoad] = useState(loadResult);
  const [portfolio,setPortfolio] = useState<PaperPortfolio>(initialLoad.portfolio);
  const [symbol,setSymbol] = useState('TCS');
  const [side,setSide] = useState<'BUY'|'SELL'>('BUY');
  const [quantity,setQuantity] = useState('1');
  const [price,setPrice] = useState('');
  const [message,setMessage] = useState(initialLoad.recoveredInvalidData ? (initialLoad.recoveryCopySaved ? (language==='HI'?'पुराना पोर्टफोलियो डेटा अमान्य था। उसकी कॉपी सुरक्षित रखी गई है; नया वर्चुअल पोर्टफोलियो शुरू हुआ।':'Saved portfolio data was invalid. A recovery copy was preserved; a fresh virtual portfolio was started.') : (language==='HI'?'पुराना डेटा अमान्य था और उसकी कॉपी सुरक्षित नहीं हो सकी।':'Saved portfolio data was invalid and a recovery copy could not be saved.')) : '');
  const [messageError,setMessageError] = useState(initialLoad.recoveredInvalidData);
  const [restorePreview,setRestorePreview] = useState<PaperPortfolio | null>(null);
  const [historyFrom,setHistoryFrom] = useState('');
  const [historyTo,setHistoryTo] = useState('');
  const [backupInput,setBackupInput] = useState<HTMLInputElement | null>(null);
  useEffect(()=>{try{localStorage.setItem(PAPER_PORTFOLIO_STORAGE_KEY,JSON.stringify(portfolio));}catch{setMessage(hi?'इस डिवाइस पर सेव नहीं हो पाया।':'Could not save on this device.');setMessageError(true);}},[portfolio,hi]);
  const valuation = useMemo(()=>valuePaperPortfolio(portfolio,{}),[portfolio]);
  const analytics = useMemo(()=>calculatePaperTradingAnalytics(portfolio.trades),[portfolio.trades]);
  const filteredTrades = useMemo(()=>filterPaperTradesByDate(portfolio.trades,{from:historyFrom,to:historyTo}),[portfolio.trades,historyFrom,historyTo]);
  const invalidDateRange = Boolean(historyFrom && historyTo && historyFrom>historyTo);
  const positions = Object.values(portfolio.positions);
  const submit = () => {
    const result = placePaperOrder(portfolio,{symbol,side,quantity:Number(quantity),price:Number(price)});
    if(!result.ok){setMessage(result.message);setMessageError(true);return;}
    setPortfolio(result.portfolio);
    setMessage(hi?'पेपर ऑर्डर सफलतापूर्वक दर्ज हुआ।':'Paper order recorded successfully.');
    setMessageError(false);
    setPrice('');
  };
  const exportBackup = () => {
    const ok = downloadPaperPortfolioBackup(createPaperPortfolioBackup(portfolio));
    setMessage(ok ? (hi?'पेपर पोर्टफोलियो बैकअप डाउनलोड हुआ।':'Paper portfolio backup downloaded.') : (hi?'बैकअप डाउनलोड नहीं हो पाया।':'Could not download the backup.'));
    setMessageError(!ok);
  };
  const selectBackup = async (file?: File) => {
    if (!file) return;
    if (file.size > 1_000_000) { setMessage(hi?'फाइल 1 MB से बड़ी है।':'Backup file exceeds 1 MB.'); setMessageError(true); return; }
    const result = parsePaperPortfolioBackup(await file.text());
    if (!result.ok) { setMessage(result.message); setMessageError(true); setRestorePreview(null); return; }
    setRestorePreview(result.backup.portfolio);
    setMessage(hi?'बैकअप जाँच सफल। नीचे विवरण देखकर Restore करें।':'Backup validated. Review the preview and confirm restore below.');
    setMessageError(false);
  };
  const confirmRestore = () => {
    if (!restorePreview) return;
    if (!window.confirm(hi?'मौजूदा पेपर पोर्टफोलियो और ट्रेड इतिहास को बैकअप से बदलें?':'Replace this device current paper portfolio and trade history with this backup?')) return;
    setPortfolio(restorePreview); setRestorePreview(null);
    if (backupInput) backupInput.value='';
    setMessage(hi?'पेपर पोर्टफोलियो सफलतापूर्वक Restore हुआ।':'Paper portfolio restored successfully.'); setMessageError(false);
  };
  const deleteTrade = (tradeId:string) => {
    if(!window.confirm(hi?'क्या आप इस पेपर ट्रेड को हटाना चाहते हैं? बाकी इतिहास दोबारा जाँचा जाएगा।':'Remove this paper trade? The remaining ledger will be replayed and validated.')) return;
    const result=removePaperTrade(portfolio,tradeId);
    if(!result.ok){setMessage(result.message);setMessageError(true);return;}
    setPortfolio(result.portfolio);
    setMessage(hi?'ट्रेड हटाया गया और पोर्टफोलियो दोबारा गणना हुआ।':'Trade removed and portfolio rebuilt successfully.');
    setMessageError(false);
  };
  const reset = () => {
    if(!window.confirm(hi?'क्या आप पूरा पेपर पोर्टफोलियो रीसेट करना चाहते हैं?':'Reset the entire paper portfolio?')) return;
    setPortfolio(createPaperPortfolio(100000)!);
    setMessage(hi?'पेपर पोर्टफोलियो रीसेट हुआ।':'Paper portfolio reset.');
    setMessageError(false);
  };
  return <section className="workspace-page paper-workspace">
    <div className="page-heading"><div><div className="eyebrow muted">{hi?'केवल वर्चुअल ट्रेडिंग':'VIRTUAL TRADING ONLY'}</div><h1>{hi?'पेपर ट्रेडिंग':'Paper Trading'}</h1><p>{hi?'बिना वास्तविक पैसे या ब्रोकर ऑर्डर के अपनी रणनीति का अभ्यास करें।':'Practice a strategy without real money or broker orders.'}</p></div><button className="secondary" onClick={reset}><RotateCcw size={15}/>{hi?'रीसेट':'Reset portfolio'}</button></div>
    <div className="paper-warning"><ShieldAlert size={17}/><span><b>{hi?'सिम्युलेशन मोड':'Simulation mode'}:</b> {hi?'यहाँ कीमत आप स्वयं दर्ज करते हैं। कोई लाइव मार्केट डेटा, ब्रोकरेज कनेक्शन या वास्तविक ऑर्डर नहीं है।':'Prices are manually entered reference prices. No live market feed, broker connection or real order is involved.'}</span></div>
    <div className="paper-metrics">
      <article className="paper-metric"><span>{hi?'वर्चुअल कैश':'Virtual cash'}</span><strong>{money(portfolio.cash)}</strong><small>{hi?'उपलब्ध पेपर बैलेंस':'Available paper balance'}</small></article>
      <article className="paper-metric"><span>{hi?'होल्डिंग्स':'Holdings'}</span><strong>{positions.length}</strong><small>{hi?'अलग-अलग सिंबल':'Unique symbols'}</small></article>
      <article className="paper-metric"><span>{hi?'कुल पेपर ट्रेड':'Paper trades'}</span><strong>{portfolio.trades.length}</strong><small>{hi?'इस डिवाइस पर सेव':'Saved on this device'}</small></article>
      <article className="paper-metric"><span>{hi?'पोर्टफोलियो मूल्य':'Portfolio value'}</span><strong>{valuation.totalEquity===null?hi?'कीमत उपलब्ध नहीं':'Price unavailable':money(valuation.totalEquity)}</strong><small>{hi?'होल्डिंग कीमतें उपलब्ध नहीं':'No verified market prices connected'}</small></article>
      <article className="paper-metric"><span>{hi?'वास्तविक लाभ/हानि':'Realized P/L'}</span><strong className={analytics.realizedProfitLoss>=0?'paper-buy':'paper-sell'}>{analytics.valid?money(analytics.realizedProfitLoss):hi?'डेटा अमान्य':'Invalid ledger'}</strong><small>{hi?'बेचे गए शेयरों पर':'From completed sells only'}</small></article>
      <article className="paper-metric"><span>{hi?'कुल खरीद':'Buy turnover'}</span><strong>{analytics.valid?money(analytics.buyTurnover):'—'}</strong><small>{hi?'पेपर खरीद का कुल मूल्य':'Total paper buy value'}</small></article>
      <article className="paper-metric"><span>{hi?'कुल बिक्री':'Sell turnover'}</span><strong>{analytics.valid?money(analytics.sellTurnover):'—'}</strong><small>{hi?'पेपर बिक्री का कुल मूल्य':'Total paper sell value'}</small></article>
    </div>
    <div className="paper-layout">
      <div className="panel paper-order-panel"><div className="panel-title"><div><span className="eyebrow muted">{hi?'नया पेपर ऑर्डर':'NEW PAPER ORDER'}</span><h3>{hi?'ऑर्डर दर्ज करें':'Place a paper order'}</h3></div><Wallet size={19}/></div>
        <label>{hi?'स्टॉक सिंबल':'Stock symbol'}<input value={symbol} maxLength={24} onChange={e=>setSymbol(e.target.value.toUpperCase())} placeholder="e.g. TCS"/></label>
        <div className="paper-side-toggle"><button className={side==='BUY'?'active buy':''} onClick={()=>setSide('BUY')}><ArrowDownLeft size={15}/>{hi?'खरीदें':'Buy'}</button><button className={side==='SELL'?'active sell':''} onClick={()=>setSide('SELL')}><ArrowUpRight size={15}/>{hi?'बेचें':'Sell'}</button></div>
        <div className="paper-input-grid"><label>{hi?'मात्रा (शेयर)':'Quantity (shares)'}<input type="number" min="1" step="1" value={quantity} onChange={e=>setQuantity(e.target.value)}/></label><label>{hi?'संदर्भ कीमत (₹)':'Reference price (₹)'}<input type="number" min="0.01" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} placeholder="Enter manually"/></label></div>
        <div className="paper-order-total">{hi?'ऑर्डर मूल्य':'Order value'} <b>{Number(quantity)>0&&Number(price)>0?money(Number(quantity)*Number(price)):money(0)}</b></div>
        <button className="primary paper-submit" onClick={submit}>{side==='BUY'?(hi?'पेपर खरीद ऑर्डर':'Place paper buy'):(hi?'पेपर बिक्री ऑर्डर':'Place paper sell')}</button>
        {message&&<p className={messageError?'paper-message error':'paper-message'} role="status">{message}</p>}
      </div>
      <div className="panel"><div className="panel-title"><div><span className="eyebrow muted">{hi?'आपकी होल्डिंग्स':'YOUR HOLDINGS'}</span><h3>{hi?'पेपर पोर्टफोलियो':'Paper portfolio'}</h3></div></div>
        {positions.length===0?<div className="empty">{hi?'अभी कोई पेपर होल्डिंग नहीं है।':'No paper holdings yet. Record a buy order to begin.'}</div>:<div className="table-wrap"><table><thead><tr><th>{hi?'सिंबल':'Symbol'}</th><th>{hi?'मात्रा':'Qty'}</th><th>{hi?'औसत लागत':'Avg. cost'}</th><th>{hi?'कुल लागत':'Cost value'}</th></tr></thead><tbody>{positions.map(p=><tr key={p.symbol}><td><b>{p.symbol}</b></td><td>{p.quantity}</td><td>{money(p.averageCost)}</td><td>{money(p.quantity*p.averageCost)}</td></tr>)}</tbody></table></div>}
        <p className="panel-copy">{hi?'होल्डिंग का वर्तमान बाजार मूल्य तब तक नहीं दिखेगा जब तक सत्यापित कीमत स्रोत कनेक्ट न हो।':'Current market value and profit/loss remain unavailable until a verified price source is connected.'}</p>
      </div>
    </div>
    <div className="panel paper-history"><div className="panel-title"><div><span className="eyebrow muted">{hi?'ऑर्डर लॉग':'ORDER LOG'}</span><h3>{hi?'पेपर ट्रेड इतिहास':'Paper trade history'}</h3></div><button className="secondary" disabled={filteredTrades.length===0} onClick={()=>downloadPaperTradesCsv(filteredTrades)}>{hi?'CSV डाउनलोड':'Export filtered CSV'}</button></div>
      <div className="paper-history-filters"><label>{hi?'शुरुआत की तारीख':'From date'}<input type="date" value={historyFrom} onChange={e=>setHistoryFrom(e.target.value)}/></label><label>{hi?'अंतिम तारीख':'To date'}<input type="date" value={historyTo} onChange={e=>setHistoryTo(e.target.value)}/></label><button className="secondary" onClick={()=>{setHistoryFrom('');setHistoryTo('');}}>{hi?'फ़िल्टर हटाएँ':'Clear filter'}</button><span>{invalidDateRange?(hi?'तारीख सीमा गलत है':'Invalid date range'):(hi?'दिखाए गए ट्रेड':'Trades shown')+': '+filteredTrades.length}</span></div>
      <div className="paper-backup-actions"><button className="secondary" onClick={exportBackup}>{hi?'JSON बैकअप डाउनलोड':'Download JSON backup'}</button><button className="secondary" onClick={()=>backupInput?.click()}>{hi?'JSON बैकअप चुनें':'Choose JSON backup'}</button><input ref={setBackupInput} type="file" accept="application/json,.json" hidden onChange={e=>{void selectBackup(e.target.files?.[0]);}} /></div>
      {restorePreview&&<div className="paper-warning"><span>{hi?'बैकअप पूर्वावलोकन':'Backup preview'}: {restorePreview.trades.length} {hi?'ट्रेड':'trades'}, {Object.keys(restorePreview.positions).length} {hi?'होल्डिंग':'holdings'}, {money(restorePreview.cash)} {hi?'वर्चुअल कैश':'virtual cash'}.</span><button className="primary" onClick={confirmRestore}>{hi?'Restore की पुष्टि करें':'Confirm restore'}</button><button className="secondary" onClick={()=>setRestorePreview(null)}>{hi?'रद्द':'Cancel'}</button></div>}
      {filteredTrades.length===0?<div className="empty">{portfolio.trades.length===0?(hi?'आपके पेपर ऑर्डर यहाँ दिखाई देंगे।':'Your paper orders will appear here.'):(hi?'इस तारीख सीमा में कोई ट्रेड नहीं मिला।':'No trades found in this date range.')}</div>:<div className="table-wrap"><table><thead><tr><th>{hi?'समय':'Time'}</th><th>{hi?'सिंबल':'Symbol'}</th><th>{hi?'प्रकार':'Side'}</th><th>{hi?'मात्रा':'Qty'}</th><th>{hi?'कीमत':'Price'}</th><th>{hi?'मूल्य':'Value'}</th><th>{hi?'कार्रवाई':'Action'}</th></tr></thead><tbody>{[...filteredTrades].reverse().map(t=><tr key={t.id}><td>{new Date(t.executedAt).toLocaleString()}</td><td><b>{t.symbol}</b></td><td><span className={t.side==='BUY'?'paper-buy':'paper-sell'}>{t.side}</span></td><td>{t.quantity}</td><td>{money(t.price)}</td><td>{money(t.grossValue)}</td><td><button className="secondary paper-delete-trade" onClick={()=>deleteTrade(t.id)}>{hi?'हटाएँ':'Remove'}</button></td></tr>)}</tbody></table></div>}
    </div>
  </section>;
}
