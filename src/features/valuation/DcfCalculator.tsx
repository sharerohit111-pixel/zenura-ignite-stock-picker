import { useMemo, useState } from 'react';
import { calculateDcf } from './engine';
import './valuation.css';
const money = (value:number) => new Intl.NumberFormat('en-IN',{maximumFractionDigits:2}).format(value);
export default function DcfCalculator({language='EN'}:{language?:'EN'|'HI'}) {
  const [fcf,setFcf]=useState('1000');
  const [growth,setGrowth]=useState('12');
  const [discount,setDiscount]=useState('14');
  const [terminal,setTerminal]=useState('5');
  const [years,setYears]=useState('5');
  const [debt,setDebt]=useState('500');
  const [shares,setShares]=useState('100');
  const hi=language==='HI';
  const errorHindi:Record<string,string> = {
    'Base free cash flow must be greater than zero.':'आधार मुक्त नकदी प्रवाह शून्य से अधिक होना चाहिए।',
    'Growth rate must be between -100% and 100%.':'वृद्धि दर -100% से 100% के बीच होनी चाहिए।',
    'Discount rate must be above 0% and at most 100%.':'डिस्काउंट रेट 0% से अधिक और अधिकतम 100% होना चाहिए।',
    'Terminal growth must be between -50% and 50%.':'टर्मिनल वृद्धि -50% से 50% के बीच होनी चाहिए।',
    'Discount rate must exceed terminal growth rate.':'डिस्काउंट रेट, टर्मिनल वृद्धि दर से अधिक होना चाहिए।',
    'Forecast horizon must be 1 to 10 years.':'पूर्वानुमान अवधि 1 से 10 वर्ष के बीच होनी चाहिए।',
    'Net debt must be a finite number.':'नेट ऋण के लिए वैध संख्या दर्ज करें।',
    'Shares outstanding must be greater than zero.':'बकाया शेयरों की संख्या शून्य से अधिक होनी चाहिए।',
    'Assumptions produce a non-finite forecast. Reduce the cash flow or growth assumptions.':'इन मान्यताओं से अमान्य पूर्वानुमान बन रहा है। नकदी प्रवाह या वृद्धि की मान्यताएँ घटाएँ।',
    'Assumptions produce a non-finite valuation result. Review cash flow, net debt and shares outstanding.':'इन मान्यताओं से अमान्य मूल्यांकन परिणाम बन रहा है। नकदी प्रवाह, नेट ऋण और शेयर संख्या जाँचें।'
  };
  const result=useMemo(()=>calculateDcf({baseFreeCashFlow:Number(fcf),growthRate:Number(growth)/100,discountRate:Number(discount)/100,terminalGrowthRate:Number(terminal)/100,forecastYears:Number(years),netDebt:Number(debt),sharesOutstanding:Number(shares)}),[fcf,growth,discount,terminal,years,debt,shares]);
  const fields=[[hi?'आधार FCFF':'Base FCFF','₹ crore',fcf,setFcf],[hi?'FCFF वृद्धि':'FCFF growth','%',growth,setGrowth],[hi?'डिस्काउंट रेट / WACC':'Discount rate / WACC','%',discount,setDiscount],[hi?'टर्मिनल वृद्धि':'Terminal growth','%',terminal,setTerminal],[hi?'पूर्वानुमान वर्ष':'Forecast years',hi?'वर्ष':'years',years,setYears],[hi?'नेट ऋण':'Net debt','₹ crore',debt,setDebt],[hi?'बकाया शेयर':'Shares outstanding',hi?'करोड़':'crore',shares,setShares]] as const;
  return <section className="workspace-page">
    <div className="page-heading"><div><div className="eyebrow muted">{hi?'मूल्यांकन टूलकिट':'VALUATION TOOLKIT'}</div><h1>{hi?'DCF मूल्यांकन लैब':'DCF Valuation Lab'}</h1><p>{hi?'अपने अनुमानों से पारदर्शी FCFF Discounted Cash Flow परिदृश्य बनाएं।':'Build a transparent FCFF discounted cash flow scenario using your own assumptions.'}</p></div></div>
    <div className="market-disclaimer"><b>{hi?'केवल मॉडल — कंपनी का डेटा कनेक्ट नहीं है।':'Model only — no company data is connected.'}</b> {hi?'केवल सत्यापित वित्तीय इनपुट भरें। यह शैक्षिक अनुमान है, लक्ष्य मूल्य या निवेश सलाह नहीं। सभी राशि ₹ करोड़ और शेयर संख्या करोड़ में रखें।':'Enter verified financial inputs yourself. This is an educational estimate, not a target price or investment recommendation. Keep all monetary inputs in ₹ crore and share count in crore.'}</div>
    <div className="dcf-layout"><div className="panel dcf-inputs"><div className="panel-title"><div><span className="eyebrow muted">{hi?'मॉडल मान्यताएँ':'MODEL ASSUMPTIONS'}</span><h3>{hi?'परिदृश्य इनपुट':'Scenario inputs'}</h3></div></div>
      {fields.map(([label,unit,value,setter])=><label className="dcf-field" key={label}><span>{label}<small>{unit}</small></span><input type="number" step="any" value={value} onChange={e=>setter(e.target.value)}/></label>)}
      <button className="secondary compact" onClick={()=>{setFcf('1000');setGrowth('12');setDiscount('14');setTerminal('5');setYears('5');setDebt('500');setShares('100');}}>{hi?'उदाहरण मान रीसेट करें':'Reset example assumptions'}</button>
    </div><div className="dcf-output">
      {result.ok ? <><div className="dcf-result panel"><span className="eyebrow muted">{hi?'मॉडल के अनुसार प्रति शेयर आंतरिक मूल्य':'MODELLED INTRINSIC VALUE / SHARE'}</span><strong>₹ {money(result.result.intrinsicValuePerShare)}</strong><small>{hi?'केवल दर्ज की गई मान्यताओं पर आधारित · बाजार भाव नहीं':'Based only on the assumptions entered · not market price'}</small></div>
      <div className="panel dcf-breakdown"><h3>{hi?'मूल्यांकन विवरण':'Valuation bridge'} <small>₹ crore</small></h3><div><span>{hi?'पूर्वानुमान नकदी प्रवाह का वर्तमान मूल्य':'PV of forecast cash flows'}</span><b>{money(result.result.presentValueForecast)}</b></div><div><span>{hi?'टर्मिनल मूल्य का वर्तमान मूल्य':'PV of terminal value'}</span><b>{money(result.result.presentValueTerminal)}</b></div><div><span>{hi?'एंटरप्राइज वैल्यू':'Enterprise value'}</span><b>{money(result.result.enterpriseValue)}</b></div><div><span>{hi?'घटाएँ: नेट ऋण':'Less: net debt'}</span><b>{money(result.result.assumptions.netDebt)}</b></div><div className="total"><span>{hi?'इक्विटी वैल्यू':'Equity value'}</span><b>{money(result.result.equityValue)}</b></div></div>
      <div className="market-disclaimer">{result.result.warnings.map(w=><p key={w}>• {w}</p>)}</div></> : <div className="panel"><h3>{hi?'मॉडल इनपुट जाँचें':'Check model inputs'}</h3>{result.errors.map(e=><p className="dcf-error" key={e}>{hi?(errorHindi[e] || e):e}</p>)}</div>}
    </div></div>
  </section>;
}
