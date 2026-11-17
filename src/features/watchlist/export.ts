export type WatchlistExportRow = { name:string; symbol:string; sector:string; roe:number; pe:number; status:string; notes:string };

const csvCell = (value:string | number) => {
  // Prevent spreadsheet formula injection from user-controlled text fields.
  const raw = String(value);
  const safe = typeof value === 'string' && /^[\\s]*[=+@\\-\\t\\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
};

export function buildWatchlistCsv(rows:WatchlistExportRow[]) {
  const header = ['Company','Symbol','Sector','ROE (%)','P/E','Research status','My notes'];
  const body = rows.map(row => [row.name,row.symbol,row.sector,row.roe,row.pe,row.status,row.notes]);
  const csv = [header,...body].map(row=>row.map(csvCell).join(',')).join('\\r\\n');
  return '\\uFEFF' + csv;
}

export function exportWatchlistCsv(rows:WatchlistExportRow[]) {
  const blob = new Blob([buildWatchlistCsv(rows)],{type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'zenura-ignite-watchlist.csv';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
