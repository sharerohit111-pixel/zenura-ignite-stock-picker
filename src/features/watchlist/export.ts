export type WatchlistExportRow = { name:string; symbol:string; sector:string; roe:number; pe:number };

const csvCell = (value:string | number) => {
  const text = String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

export function exportWatchlistCsv(rows:WatchlistExportRow[]) {
  const header = ['Company','Symbol','Sector','ROE (%)','P/E'];
  const body = rows.map(row => [row.name,row.symbol,row.sector,row.roe,row.pe]);
  const csv = [header,...body].map(row=>row.map(csvCell).join(',')).join('\r\n');
  const blob = new Blob(['\uFEFF',csv],{type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'zenura-ignite-watchlist.csv';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
