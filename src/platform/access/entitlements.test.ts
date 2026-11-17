import { describe, expect, it } from 'vitest';
import { hasFeatureAccess, normalizeAppPlan } from './entitlements';

describe('future-ready app entitlements', () => {
  it('keeps core paper trading and basic research available on Free', () => {
    expect(hasFeatureAccess('FREE', 'paperTrading')).toBe(true);
    expect(hasFeatureAccess('FREE', 'basicScreener')).toBe(true);
    expect(hasFeatureAccess('FREE', 'companyResearchBasic')).toBe(true);
  });

  it('reserves advanced tools for Premium without enabling live market data', () => {
    expect(hasFeatureAccess('FREE', 'advancedFilters')).toBe(false);
    expect(hasFeatureAccess('PREMIUM', 'advancedFilters')).toBe(true);
    expect(hasFeatureAccess('PREMIUM', 'portfolioAnalyticsAdvanced')).toBe(true);
    expect(hasFeatureAccess('PREMIUM', 'reportsExportAdvanced')).toBe(true);
    expect(hasFeatureAccess('PREMIUM', 'liveMarketData')).toBe(false);
  });

  it('defaults unknown client-supplied plans to Free', () => {
    expect(normalizeAppPlan('PREMIUM')).toBe('PREMIUM');
    expect(normalizeAppPlan('admin')).toBe('FREE');
    expect(normalizeAppPlan(null)).toBe('FREE');
  });
});
