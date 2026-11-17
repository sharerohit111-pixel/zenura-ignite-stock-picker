/**
 * ZENURA IGNITE — future-ready feature entitlements.
 *
 * This is a pure policy layer only. It does not authenticate users, process
 * payments, or grant market-data redistribution rights. Production callers
 * must obtain the plan from a trusted server-side identity/billing service.
 */
export type AppPlan = 'FREE' | 'PREMIUM';
export type AppFeature =
  | 'paperTrading'
  | 'basicScreener'
  | 'companyResearchBasic'
  | 'advancedFilters'
  | 'portfolioAnalyticsAdvanced'
  | 'reportsExportAdvanced'
  | 'liveMarketData';

const PLAN_FEATURES: Record<AppPlan, ReadonlySet<AppFeature>> = {
  FREE: new Set<AppFeature>([
    'paperTrading',
    'basicScreener',
    'companyResearchBasic',
  ]),
  PREMIUM: new Set<AppFeature>([
    'paperTrading',
    'basicScreener',
    'companyResearchBasic',
    'advancedFilters',
    'portfolioAnalyticsAdvanced',
    'reportsExportAdvanced',
    // Market data is deliberately excluded until a separate provider licence
    // and server-side entitlement explicitly authorize the user and audience.
  ]),
};

export function hasFeatureAccess(plan: AppPlan, feature: AppFeature): boolean {
  return PLAN_FEATURES[plan].has(feature);
}

/** Never trust a plan string received from local storage or browser input. */
export function normalizeAppPlan(value: unknown): AppPlan {
  return value === 'PREMIUM' ? 'PREMIUM' : 'FREE';
}
