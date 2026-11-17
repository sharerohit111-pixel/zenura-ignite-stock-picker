import type { PaperTrade } from './engine';

const cell = (value: string | number): string => {
  const raw = String(value);
  const safe = /^[=+@\-\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
};

/** CSV export for locally recorded paper trades; protects spreadsheet formula cells. */
export function createPaperTradesCsv(trades: readonly PaperTrade[]): string {
  const rows = [
    ['Trade ID', 'Executed At', 'Symbol', 'Side', 'Quantity', 'Reference Price (INR)', 'Gross Value (INR)'],
    ...trades.map(t => [t.id, t.executedAt, t.symbol, t.side, t.quantity, t.price, t.grossValue])
  ];
  return rows.map(row => row.map(cell).join(',')).join('\r\n');
}

export function downloadPaperTradesCsv(trades: readonly PaperTrade[]): boolean {
  if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof Blob === 'undefined') return false;
  const blob = new Blob(['\uFEFF', createPaperTradesCsv(trades)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `zenura-ignite-paper-trades-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    return true;
  } finally {
    URL.revokeObjectURL(url);
  }
}
