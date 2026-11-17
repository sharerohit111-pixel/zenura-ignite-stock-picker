# ZENURA IGNITE — Feature Status

Status meanings: Prototype · Implemented · Automated tests passing · Live · Blocked.

| Area | Feature | Status | Notes |
|---|---|---|---|
| Branding | Product name and subtitle across app shell, report, HTML title and PWA metadata | Implemented | ZENURA IGNITE — Paper Trading & Paper Investing |
| Shell | Responsive research dashboard and primary navigation | Implemented | Full-width mobile/tablet layout fix deployed; real-device QA remains |
| Search | Global company/commodity search UI | Prototype | Searches illustrative demo catalogue only; no verified exchange master |
| Search | NSE/BSE master search, symbol and ISIN lookup | Blocked | Requires approved company master/data provider |
| Preferences | English/Hindi preference persistence | Implemented | Preference persists; complete Hindi translation remains |
| Preferences | DCF validation errors in Hindi | Implemented | DCF field and result copy still needs full language QA |
| Preferences | Dark/light theme persistence | Implemented | Device-local preference; visual accessibility QA remains |
| Navigation | Mobile sidebar and Back-to-Top | Implemented | Responsive CSS and interactions present; device QA remains |
| Screener | ROE, ROCE, P/E, P/B, Debt/Equity filters | Prototype | Engine wired; sample values are explicitly illustrative and unverified |
| Screener | Metric definitions and typed financial observations | Implemented | Provider-neutral metric catalogue and provenance contracts; provider integration remains |
| Screener | Custom screens, filter builder and saved screens | Implemented | Browser-local save/restore/delete and validation; sync not included |
| Company research | Financial statements and multi-year trends | Implemented | Annual/Quarterly/TTM kept separate; empty until approved source is connected |
| Company research | Provenance and freshness audit utilities | Implemented | Source/licence/period/unit/freshness checks; provider data integration remains |
| Data architecture | Company identity, listings and ISIN deduplication | Implemented | Contracts exist; verified master and reconciliation remain |
| Data architecture | Validation, missing-data and safe ratio helpers | Implemented | Provider-neutral helpers; broader provider fixture coverage remains |
| Commodities | Independent instrument and contract schema | Implemented | Separate from equities; verified contract master remains |
| Commodities | Research segment and category filters | Prototype | Illustrative catalogue only; no live prices |
| Commodities | Futures/options, OI, seasonality, global benchmarks | Blocked | Requires licensed exchange/provider feed and contract master |
| Valuation | FCFF DCF calculator | Implemented | User-entered assumptions only; educational model, not a target price |
| Quality score | Explainable weighted score and evidence coverage | Implemented | Engine withholds score below coverage threshold; no company score until verified inputs exist |
| Comparison | Period-aligned company comparison | Implemented | UI and engine present; figures withheld until verified provider data exists |
| Watchlist | Add/remove and browser-local persistence | Prototype | Demo companies only; no account sync |
| Watchlist | Research notes and CSV export | Implemented | Local notes are validated and CSV export protects against spreadsheet formula injection |
| Watchlist | Versioned JSON backup and validated restore | Implemented | Export/restore controls in Watchlist; restore validates format, version, symbols and notes, then asks before replacing local data; device-local only |
| Paper Trading | Virtual portfolio engine and order validation | Implemented | ₹1,00,000 virtual starting cash; BUY/SELL uses manually entered reference prices; no broker/exchange execution |
| Paper Trading | Portfolio positions and trade history | Implemented | Browser-local persistence; missing reference prices remain unavailable, not zero |
| Paper Trading | Realized P/L and turnover analytics | Implemented | Ledger replay calculates realized P/L, buy/sell turnover and completed trades |
| Paper Trading | Trade history CSV export | Implemented | CSV escaping and spreadsheet formula-injection protection included |
| Paper Trading | Versioned JSON backup and validated restore | Implemented | Export/restore validates portfolio ledger, cash and positions; preview and confirmation before replacing local data; device-local only |
| AI | Grounded research assistant | Blocked | Requires verified data pipeline and secure model service |
| Reports | Editable research note and Print / Save PDF | Implemented | Browser print-to-PDF; report clearly warns that no market data is connected |
| PWA | Manifest, icon and service worker shell | Implemented | Cache version updated; install/offline QA remains |
| Security | Authentication, authorization, audit and API security | Blocked | Architecture plan documented; provider/hosting decisions and implementation remain |
| Backend | Provider ingestion, API, cache and monitoring | Blocked | Static GitHub Pages cannot safely store provider secrets |
| Monetization | Ads and subscriptions | Disabled by design | Must remain disabled for initial release |
| Release | CI tests, type-check, build | Automated tests passing | Latest main commit passed automated build verification; paper-trading backup/restore commit `6ef92b0` verified |
| Release | GitHub Pages deployment | Live | Latest main commit deployment succeeded on 17 Nov 2026 |
| Release | Android Chrome/iOS Safari, offline/PWA and accessibility QA | Pending | Requires physical-device/browser verification |

## Non-negotiable data integrity

- Demo values are not real securities or investment information.
- Never show a quote as live without a verified source and timestamp.
- Every metric must retain source, period, unit, timestamps and validation status.
- Missing values must never be represented as zero.
- Keep Stock and Commodities modules isolated.
- Do not represent the product subtitle as proof that paper trading or investing execution features are complete.

## Release blockers

1. Select a provider and obtain written confirmation that the intended commercial app display/use is licensed.
2. Select backend hosting/database and managed identity/OTP provider.
3. Store provider credentials only in a secure backend secret store—not in the static frontend or GitHub Pages bundle.
4. Implement backend ingestion/API, source registry, exchange master reconciliation, caching, monitoring and access controls.
5. Complete Hindi translation and grounded AI only after the data pipeline is verified.
6. Complete physical-device accessibility, responsive, offline and PWA update QA.
7. Enable login only after OTP, recovery, authorization and end-to-end security tests pass.

See [Backend, Authentication and Security Plan](SECURITY-AND-BACKEND-PLAN.md) for phases and acceptance criteria.

Ads and paid subscriptions remain disabled.
