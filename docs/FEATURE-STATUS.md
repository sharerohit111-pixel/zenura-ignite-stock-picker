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


## Engineering milestone — 17 Nov 2026

- Added a provider-neutral FCFF DCF calculation engine with input validation, explicit net-debt bridge, per-share output and sensitivity caveats: `src/features/valuation/engine.ts`.
- Added an explainable six-factor score aggregator with coverage disclosure and score withholding below the configured coverage threshold: `src/features/quality-score/engine.ts`.
- Added a period-safe comparison engine. It only marks values comparable when the requested period type and period end align and all selected observations are verified: `src/features/comparison/engine.ts`.
- These are calculation/domain engines, not yet complete end-user screens. Their UI integration and automated unit tests remain open work.
- The public app still uses an explicitly labelled illustrative demo universe for navigation and screener interaction. It is not an NSE/BSE company master and must not be treated as market research data.
- Build and Pages deployment workflows have passed for prior UI commits. The latest comparison-engine commit is awaiting CI confirmation.

## Release blockers (must not be represented as complete)

1. Select and approve a licensed Indian equity market-data provider; configure secrets only after the provider account and terms are confirmed.
2. Implement a secure backend ingestion/API layer, source registry, exchange master reconciliation, cache and monitoring. GitHub Pages alone is a static frontend and must not hold provider secrets.
3. Integrate DCF, quality and comparison engines into reviewed UI flows; add automated unit tests and edge-case fixtures.
4. Complete accessibility, Android Chrome/iOS Safari responsive QA, offline/PWA install tests, and stale-cache update tests.
5. Implement authentication and user data sync only after backend/security design.

Paper trading/investing, advertisements and paid subscriptions remain out of initial release scope or disabled as previously specified.
