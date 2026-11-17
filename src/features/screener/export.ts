export type ScreenerExportRow = {
  name: string; symbol: string; sector: string;
  roe: number; roce: number; pe: number; pb: number; debtToEquity: number;
  dataStatus: string;
};

const csvCell = (value: string | number) => {
  const raw = String(value);
  const safe = typeof value === 'string' && /^[\\s]*[=+@\\-\\t\\r]/.test(raw) ? "'" + raw : raw;
  return '"' + safe.replace(/"/g, '""') + '"';
};

/** Export only the rows currently visible after filtering; all demo rows retain an explicit status. */
export function buildScreenerCsv(rows: ScreenerExportRow[]): string {
  const header = ['Company','Symbol','Sector','ROE (%)','ROCE (%)','P/E','P/B','Debt / Equity','Data status'];
  const body = rows.map(row => [row.name,row.symbol,row.sector,row.roe,row.roce,row.pe,row.pb,row.debtToEquity,row.dataStatus]);
  return '\uFEFF' + [header,...body].map(row => row.map(csvCell).join(',')).join('\\r\\n');
}

export function exportScreenerCsv(rows: ScreenerExportRow[]): void {
  const blob = new Blob([buildScreenerCsv(rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'zenura-ignite-screener-results.csv';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
