/** Canonical, provider-neutral contracts. No market data is bundled in these types. */
export type ExchangeCode = 'NSE' | 'BSE' | 'OTHER';
export type PeriodType = 'ANNUAL' | 'QUARTERLY' | 'TTM' | 'INSTANT' | 'CUSTOM';
export type DataStatus = 'VERIFIED' | 'STALE' | 'UNVERIFIED' | 'MISSING' | 'REJECTED';
export type CurrencyCode = 'INR' | 'USD' | 'OTHER';
export type MetricUnit = 'CURRENCY' | 'PERCENT' | 'MULTIPLE' | 'PER_SHARE' | 'SHARES' | 'DAYS' | 'RATIO' | 'COUNT' | 'CURRENCY_PER_SHARE';

export interface CompanyIdentity {
  /** ISIN is the preferred cross-exchange identity key when available. */
  companyId: string;
  isin?: string;
  legalName: string;
  normalizedName: string;
  sector?: string;
  industry?: string;
  country: 'IN' | string;
  identityStatus: 'CONFIRMED' | 'PROVISIONAL' | 'CONFLICT';
  updatedAt: string;
}

export interface EquityListing {
  listingId: string;
  companyId: string;
  exchange: ExchangeCode;
  symbol: string;
  series?: string;
  securityCode?: string;
  tradingStatus: 'ACTIVE' | 'SUSPENDED' | 'DELISTED' | 'UNKNOWN';
  currency: CurrencyCode;
  validFrom?: string;
  validTo?: string;
  sourceId: string;
}

export interface MetricObservation {
  observationId: string;
  companyId: string;
  listingId?: string;
  metricKey: MetricKey;
  value: number | null;
  unit: MetricUnit;
  currency?: CurrencyCode;
  periodType: PeriodType;
  periodStart?: string;
  periodEnd: string;
  sourceId: string;
  sourceReference?: string;
  sourcePublishedAt?: string;
  sourceRetrievedAt: string;
  ingestedAt: string;
  status: DataStatus;
  validationNotes?: string[];
  rawPayloadId?: string;
}

export interface MetricDefinition {
  key: MetricKey;
  label: string;
  unit: MetricUnit;
  statement: 'INCOME' | 'BALANCE_SHEET' | 'CASH_FLOW' | 'MARKET' | 'DERIVED';
  description: string;
  formula?: string;
  requiredInputs?: MetricKey[];
  preferredPeriod: PeriodType[];
  higherIsGenerallyBetter?: boolean;
}

export interface DataSourceRecord {
  sourceId: string;
  providerName: string;
  dataset: string;
  licenceStatus: 'APPROVED' | 'REVIEW_REQUIRED' | 'NOT_APPROVED';
  redistributionAllowed: boolean | null;
  attributionRequired: boolean | null;
  termsReviewedAt?: string;
}

export interface RawPayloadRecord {
  rawPayloadId: string;
  sourceId: string;
  retrievedAt: string;
  contentHash: string;
  storageUri: string;
  parserVersion: string;
}

export type MetricKey =
  | 'REVENUE' | 'REVENUE_GROWTH' | 'OPERATING_REVENUE' | 'EBITDA' | 'EBITDA_MARGIN'
  | 'OPERATING_PROFIT' | 'OPERATING_PROFIT_MARGIN' | 'PAT' | 'PAT_MARGIN' | 'PAT_GROWTH'
  | 'EPS' | 'EPS_GROWTH' | 'DILUTED_EPS' | 'GROSS_PROFIT' | 'GROSS_MARGIN'
  | 'INTEREST_EXPENSE' | 'TAX_EXPENSE' | 'DEPRECIATION_AMORTIZATION' | 'OTHER_INCOME'
  | 'TOTAL_ASSETS' | 'TOTAL_EQUITY' | 'TOTAL_DEBT' | 'NET_DEBT' | 'DEBT_TO_EQUITY'
  | 'CURRENT_ASSETS' | 'CURRENT_LIABILITIES' | 'CURRENT_RATIO' | 'QUICK_RATIO'
  | 'INVENTORY' | 'RECEIVABLES' | 'PAYABLES' | 'CASH_AND_EQUIVALENTS'
  | 'CFO' | 'CAPEX' | 'FREE_CASH_FLOW' | 'CFO_TO_PAT' | 'FCF_MARGIN'
  | 'ROE' | 'ROCE' | 'ROA' | 'ROIC' | 'ASSET_TURNOVER'
  | 'PE' | 'PB' | 'PEG' | 'EV' | 'EV_TO_EBITDA' | 'PRICE_TO_SALES'
  | 'MARKET_CAP' | 'SHARE_PRICE' | 'SHARES_OUTSTANDING' | 'BOOK_VALUE_PER_SHARE'
  | 'DIVIDEND_PER_SHARE' | 'DIVIDEND_YIELD' | 'PAYOUT_RATIO' | 'PROMOTER_HOLDING'
  | 'PROMOTER_PLEDGE' | 'FII_HOLDING' | 'DII_HOLDING' | 'FACE_VALUE';

export interface QualityScoreComponent {
  category: 'PROFITABILITY' | 'GROWTH' | 'FINANCIAL_HEALTH' | 'CASH_FLOW' | 'VALUATION' | 'GOVERNANCE_RISK';
  score: number | null;
  weight: number;
  coverage: number;
  excludedInputs: MetricKey[];
  explanation: string;
}

export interface CompanyQualityAssessment {
  companyId: string;
  score: number | null;
  scale: '0_TO_100';
  methodologyVersion: string;
  calculatedAt: string;
  components: QualityScoreComponent[];
  coverage: number;
  status: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA';
  disclaimer: string;
}

/** Commodities are intentionally independent from equity company/listing contracts. */
export type CommodityCategory = 'BULLION' | 'BASE_METALS' | 'ENERGY' | 'AGRICULTURE';
export type CommodityVenue = 'MCX' | 'NCDEX' | 'NSE' | 'BSE' | 'OTHER';
export interface CommodityInstrument {
  instrumentId: string;
  canonicalName: string;
  category: CommodityCategory;
  underlying: string;
  venue: CommodityVenue;
  contractCode: string;
  quoteCurrency: CurrencyCode;
  quoteUnit: string;
  contractUnit: string;
  lotSize: number;
  tickSize: number;
  expiryDate: string;
  tradingStatus: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'UNKNOWN';
  sourceId: string;
  sourceRetrievedAt: string;
  status: DataStatus;
}

export interface CommodityQuote {
  instrumentId: string;
  lastPrice: number | null;
  change: number | null;
  changePercent: number | null;
  volume: number | null;
  openInterest: number | null;
  asOf: string;
  sourceId: string;
  status: DataStatus;
}
