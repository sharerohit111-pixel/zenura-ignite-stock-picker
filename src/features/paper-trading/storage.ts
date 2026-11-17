import { createPaperPortfolio, type PaperPortfolio } from './engine';
import { validatePaperPortfolioBackup, PAPER_BACKUP_FORMAT, PAPER_BACKUP_VERSION } from './backup';

export const PAPER_PORTFOLIO_STORAGE_KEY = 'zi-paper-portfolio-v1';
export const PAPER_PORTFOLIO_RECOVERY_KEY = 'zi-paper-portfolio-v1-recovery';

export interface PaperPortfolioLoadResult {
  portfolio: PaperPortfolio;
  recoveredInvalidData: boolean;
  recoveryCopySaved: boolean;
}

export function loadPaperPortfolio(storage: Pick<Storage, 'getItem' | 'setItem'>): PaperPortfolioLoadResult {
  try {
    const raw = storage.getItem(PAPER_PORTFOLIO_STORAGE_KEY);
    if (raw !== null) {
      try {
        const value: unknown = JSON.parse(raw);
        const checked = validatePaperPortfolioBackup({
          format: PAPER_BACKUP_FORMAT,
          version: PAPER_BACKUP_VERSION,
          exportedAt: new Date().toISOString(),
          portfolio: value
        });
        if (checked.ok) return { portfolio: checked.backup.portfolio, recoveredInvalidData: false, recoveryCopySaved: false };
      } catch {
        // Preserve malformed local data below before starting a fresh portfolio.
      }
      let recoveryCopySaved = false;
      try {
        if (storage.getItem(PAPER_PORTFOLIO_RECOVERY_KEY) === null) {
          storage.setItem(PAPER_PORTFOLIO_RECOVERY_KEY, raw);
          recoveryCopySaved = true;
        }
      } catch {
        // Storage may be full or unavailable; report that no recovery copy was confirmed.
      }
      return {
        portfolio: createPaperPortfolio(100000)!,
        recoveredInvalidData: true,
        recoveryCopySaved
      };
    }
  } catch {
    // Storage read may be blocked; return an in-memory starter portfolio.
  }
  return { portfolio: createPaperPortfolio(100000)!, recoveredInvalidData: false, recoveryCopySaved: false };
}


/** Downloads the preserved raw recovery payload without modifying either storage key. */
export function downloadPaperPortfolioRecoveryCopy(storage: Pick<Storage, 'getItem'>): boolean {
  try {
    const raw = storage.getItem(PAPER_PORTFOLIO_RECOVERY_KEY);
    if (raw === null || typeof document === 'undefined' || typeof URL === 'undefined' || typeof Blob === 'undefined') return false;
    const blob = new Blob([raw], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'zenura-ignite-paper-recovery-copy.txt';
    anchor.click();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}
