import { useMemo, useState } from 'react';
import { FileSpreadsheet, ShieldCheck } from 'lucide-react';
import type { MetricObservation } from '../../platform/data-contracts/types';
import { buildStatementColumns, type StatementKind } from './financial-statements';

const statementLabels: Record<StatementKind, string> = { INCOME: 'Income Statement', BALANCE_SHEET: 'Balance Sheet', CASH_FLOW: 'Cash Flow' };
const periods = ['ANNUAL', 'QUARTERLY', 'TTM'] as const;

/** The panel is provider-neutral and intentionally receives no fabricated sample observations. */
export default function FinancialStatementsPanel({ observations = [], language = 'EN' }: { observations?: readonly MetricObservation[]; language?: 'EN'|'HI' }) {
  const [statement, setStatement] = useState<StatementKind>('INCOME');
  const [period, setPeriod] = useState<(typeof periods)[number]>('ANNUAL');
  const columns = useMemo(() => buildStatementColumns(observations, statement, period), [observations, statement, period]);
  const lines = columns[0]?.lines ?? [];
  return <div className="panel statement-panel">
    <div className="panel-title"><div><span className="eyebrow muted">{language==='HI'?'वित्तीय':'FINANCIALS'}</span><h3>{language==='HI'?'वित्तीय विवरण':'Financial Statements'}</h3></div><FileSpreadsheet size={19}/></div>
    <div className="statement-controls">
      <div className="commodity-tabs">{(Object.keys(statementLabels) as StatementKind[]).map(key => <button key={key} className={statement === key ? 'active' : ''} onClick={() => setStatement(key)}>{statementLabels[key]}</button>)}</div>
      <select aria-label={language==='HI'?'रिपोर्टिंग अवधि':'Reporting period'} value={period} onChange={event => setPeriod(event.target.value as (typeof periods)[number])}>{periods.map(item => <option key={item} value={item}>{item === 'TTM' ? (language==='HI'?'पिछले 12 महीने':'Trailing 12 Months') : item}</option>)}</select>
    </div>
    <div className="statement-meta"><ShieldCheck size={15}/> {language==='HI'?'अवधियाँ अलग रखी जाती हैं। मान केवल जुड़े हुए डेटा स्रोत से मिलने पर दिखते हैं।':'Periods remain separate. Values are shown only when supplied by a connected data source.'}</div>
    {columns.length ? <div className="table-wrap"><table><thead><tr><th>Metric</th>{columns.map(column => <th key={column.periodEnd}>{column.label}</th>)}</tr></thead><tbody>{lines.map(line => <tr key={line.key}><td><b>{line.label}</b></td>{columns.map(column => { const cell = column.lines.find(item => item.key === line.key); return <td key={column.periodEnd}>{cell?.value === null || cell?.value === undefined ? '—' : cell.value.toLocaleString('en-IN')}<small className="statement-status">{cell?.status ?? 'MISSING'} · {cell?.unit ?? line.unit}</small></td>; })}</tr>)}</tbody></table></div> : <div className="statement-empty"><b>{language==='HI'?`${period==='ANNUAL'?'वार्षिक':period==='QUARTERLY'?'तिमाही':'टीटीएम'} आँकड़े उपलब्ध नहीं`:`No ${period.toLowerCase()} observations available`}</b><span>{language==='HI'?'स्वीकृत प्रदाता जुड़ने और स्रोत आँकड़ों के सत्यापन के बाद '+(statement==='INCOME'?'आय विवरण':statement==='BALANCE_SHEET'?'बैलेंस शीट':'नकदी प्रवाह')+' यहाँ दिखेगा.':`${statementLabels[statement]} will populate after an approved provider is connected and its source observations pass validation.`}</span></div>}
    <div className="statement-footnote">{language==='HI'?'वार्षिक, तिमाही और टीटीएम अवधियों के बीच कोई मान अनुमानित, आगे जारी या परिवर्तित नहीं किया जाता।':'No values are estimated, carried forward, or converted between Annual, Quarterly and TTM periods.'}</div>
  </div>;
}
