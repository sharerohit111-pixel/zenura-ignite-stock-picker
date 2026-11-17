import { useMemo, useState } from 'react';
import { calculateDcf } from './engine';
import './valuation.css';
const money = (value:number) => new Intl.NumberFormat('en-IN',{maximumFractionDigits:2}).format(value);
export default function DcfCalculator() {
  const [fcf,setFcf]=useState('1000');
  const [growth,setGrowth]=useState('12');
  const [discount,setDiscount]=useState('14');
  const [terminal,setTerminal]=useState('5');
  const [years,setYears]=useState('5');
  const [debt,setDebt]=useState('500');
  const [shares,setShares]=useState('100');
  const result=useMemo(()=>calculateDcf({baseFreeCashFlow:Number(fcf),growthRate:Number(growth)/100,discountRate:Number(discount)/100,terminalGrowthRate:Number(terminal)/100,forecastYears:Number(years),netDebt:Number(debt),sharesOutstanding:Number(shares)}),[fcf,growth,discount,terminal,years,debt,shares]);
  const fields=[['Base FCFF','₹ crore',fcf,setFcf],['FCFF growth','%',growth,setGrowth],['Discount rate / WACC','%',discount,setDiscount],['Terminal growth','%',terminal,setTerminal],['Forecast years','years',years,setYears],['Net debt','₹ crore',debt,setDebt],['Shares outstanding','crore',shares,setShares]] as const;
  return <section className="workspace-page">
    <div className="page-heading"><div><div className="eyebrow muted">VALUATION TOOLKIT</div><h1>DCF Valuation Lab</h1><p>Build a transparent FCFF discounted cash flow scenario using your own assumptions.</p></div></div>
    <div className="market-disclaimer"><b>Model only — no company data is connected.</b> Enter verified financial inputs yourself. This is an educational estimate, not a target price or investment recommendation. Keep all monetary inputs in ₹ crore and share count in crore.</div>
    <div className="dcf-layout"><div className="panel dcf-inputs"><div className="panel-title"><div><span className="eyebrow muted">MODEL ASSUMPTIONS</span><h3>Scenario inputs</h3></div></div>
      {fields.map(([label,unit,value,setter])=><label className="dcf-field" key={label}><span>{label}<small>{unit}</small></span><input type="number" step="any" value={value} onChange={e=>setter(e.target.value)}/></label>)}
      <button className="secondary compact" onClick={()=>{setFcf('1000');setGrowth('12');setDiscount('14');setTerminal('5');setYears('5');setDebt('500');setShares('100');}}>Reset example assumptions</button>
    </div><div className="dcf-output">
      {result.ok ? <><div className="dcf-result panel"><span className="eyebrow muted">MODELLED INTRINSIC VALUE / SHARE</span><strong>₹ {money(result.result.intrinsicValuePerShare)}</strong><small>Based only on the assumptions entered · not market price</small></div>
      <div className="panel dcf-breakdown"><h3>Valuation bridge <small>₹ crore</small></h3><div><span>PV of forecast cash flows</span><b>{money(result.result.presentValueForecast)}</b></div><div><span>PV of terminal value</span><b>{money(result.result.presentValueTerminal)}</b></div><div><span>Enterprise value</span><b>{money(result.result.enterpriseValue)}</b></div><div><span>Less: net debt</span><b>{money(result.result.assumptions.netDebt)}</b></div><div className="total"><span>Equity value</span><b>{money(result.result.equityValue)}</b></div></div>
      <div className="market-disclaimer">{result.result.warnings.map(w=><p key={w}>• {w}</p>)}</div></> : <div className="panel"><h3>Check model inputs</h3>{result.errors.map(e=><p className="dcf-error" key={e}>{e}</p>)}</div>}
    </div></div>
  </section>;
}
