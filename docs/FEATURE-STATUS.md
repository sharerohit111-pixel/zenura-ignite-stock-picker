# ZENURA IGNITE STOCK PICKER — Feature Status

Status meanings: Pending · In Development · Completed · Tested · Live.

| Area | Feature | Status | Notes |
|---|---|---|---|
| Shell | Responsive research dashboard and primary navigation | In Development | Prototype UI exists; full device/browser QA pending |
| Search | Global company/commodity search UI | In Development | Company search selection now opens Company Research with the chosen demo identity; catalogue remains illustrative only |
| Search | NSE/BSE master search, symbol and ISIN lookup | Pending | Requires licensed/verified company master |
| Preferences | English/Hindi preference persistence | In Development | Preference persists; full-page translation pending |
| Preferences | Dark/light theme persistence | In Development | Prototype theme toggle and persistence added; visual QA pending |
| Navigation | Mobile sidebar and Back-to-Top | In Development | UI interactions implemented; device QA pending |
| Screener | ROE, ROCE, P/E, P/B, Debt/Equity filters | In Development | UI controls are wired to the provider-neutral engine; values remain illustrative demo observations |
| Screener | 60+ metric definitions and typed financial observations | In Development | Metric catalogue, periods, formulas and source metadata contracts added; provider integration pending |
| Screener | Custom screens, filter builder and saved screens | In Development | Five metric filters, search, sorting, saved-screen restore/delete and storage validation implemented; full browser QA pending |
| Company research | Financial statements and multi-year trends | In Development | Interactive Income Statement, Balance Sheet and Cash Flow views; Annual/Quarterly/TTM selector and provider-neutral period grouping added; company selection context wired; provider/backend and browser QA pending |
| Company research | Provenance and freshness audit utilities | In Development | Source registry, licence/redistribution metadata, reporting period, unit and retrieval timestamp audit added; provider data and QA pending |
| Data architecture | Company identity, exchange listings, ISIN deduplication | In Development | Canonical issuer/listing contracts added; verified company master and reconciliation pending |
| Data architecture | Validation, missing-data and safe ratio helpers | In Development | Typed validation, safe calculation and observation provenance/freshness audit helpers added; broader automated tests pending |
| Commodities | Independent instrument and contract schema | In Development | Separate commodity instrument/quote contracts added; verified exchange contract master pending |
| Valuation | P/E, P/B, PEG, EV/EBITDA, intrinsic value | Pending | Formulas, assumptions and data validation required |
| Quality score | Transparent weighted score and missing-data handling | Pending | Methodology and tests required |
| Comparison | Company and peer comparison | Pending | Pending real company data model |
| Watchlist | Add/remove and browser-local persistence | In Development | Demo companies only; account sync pending |
| Commodities | Separate research segment and category filters | In Development | Bullion, Base Metals, Energy, Agriculture; no live quotes |
| Commodities | Futures/options, OI, seasonality, global benchmarks | Pending | Exchange/provider feed and contract master required |
| Commodities | Price alerts | Pending | Backend scheduler and notification permission required |
| AI | Grounded research assistant | Pending | Verified data pipeline and model service required |
| Reports | PDF/export/share | Pending | Report engine and source metadata required |
| PWA | Manifest, icon and service worker shell | In Development | Added; install/offline QA pending |
| Security | Authentication, authorization, audit and API security | Pending | Backend architecture required |
| Monetization | Ads framework | Pending | Must remain disabled at initial launch |
| Monetization | Subscription/entitlements/payment | Pending | Must remain disabled at initial launch |
| Release | Build, automated tests, deployment and monitoring | Pending | Dependency installation/build not verified in this environment |

## Non-negotiable data integrity
- Demo values are not real securities or investment information.
- Never show a quote as live without a verified source and timestamp.
- Every metric must retain source, period, unit, timestamps and validation status.
- Keep Stock and Commodities modules isolated.
- Paper Trading and Paper Investing are out of scope until explicitly requested.

### Company search-to-research navigation (v0.5.6)
Global search results for illustrative companies now open Company Research with that company identity selected. The Research workspace also has a company selector, and the illustrative profile modal can open the same workspace. This is navigation/context only: no exchange listing is verified and no financial observations are fabricated. Full React/Vite build and browser QA remain pending because dependencies are unavailable in this environment.
