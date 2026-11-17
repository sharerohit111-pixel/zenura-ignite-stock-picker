# ZENURA IGNITE — Live Market Data Integration

## Current state

The production site is a static GitHub Pages PWA. No licensed NSE/BSE market-data provider, production API, secret store, or live quote feed is configured. The application must not call unofficial endpoints from the browser, scrape exchange pages, or claim that sample values are live.

## Integration work started

- Added a provider-neutral equity quote contract.
- Added a fail-closed quote validator for exchange/symbol identity, numeric values, source approval, timestamps, freshness and provider verification.
- Added regression tests for approved-source acceptance, unapproved sources, stale quotes, invalid values, missing prices and future timestamps.
- The contract is deliberately separate from demo catalogue data and does not contain provider credentials or claim to retrieve quotes.

## Required decisions and access

Before connecting a real feed, obtain:
1. Provider name and written licence/display/redistribution rights for the intended app audience.
2. API documentation and a sandbox/API key.
3. Backend hosting with a secret manager; provider keys must never be placed in Vite variables, browser code, GitHub Pages assets or committed files.
4. Required coverage: NSE/BSE equities, delayed vs real-time entitlement, historical candles, company master/ISIN and fundamentals/financial statements.
5. A separate MCX/NCDEX commodity entitlement if commodities are included.

## Planned safe data path

Browser PWA → authenticated application API → provider adapter → licensed provider.

The backend validates and timestamps provider responses, records source/entitlement metadata, applies rate limits and caching, and returns only data permitted by the licence. The frontend displays provider, exchange, quote time and freshness. Stale, unverified, missing or unauthorized data must be visibly marked and must never be labelled Live.

## Release gates

- No provider secrets in frontend bundles or repository history.
- Provider licence and attribution approved for the intended display.
- Server-side key storage and access controls tested.
- Quote freshness, market-hours, outage and malformed-response tests pass.
- Company master and financial-statement data have their own source and period validation.
- Live labels are enabled only for verified, fresh responses.

## Public multi-user and future Premium requirements

ZENURA IGNITE is intended for public multi-user access, with a possible Free/Premium model later. A personal API subscription is not sufficient. Before any market feed is enabled, the provider and relevant exchange permissions must explicitly cover:
- public end-user display inside this app;
- the expected user count and whether users are anonymous or authenticated;
- commercial use, including any future paid Premium tier;
- redistribution/display rights, attribution, caching and retention;
- NSE and BSE equities separately, plus MCX only if commodities are included;
- the app's paper-trading/simulation use case.

### Provider screening warning

TrueData's currently published API terms state that its data is for the subscriber's own use and prohibit sharing/display to third parties without the required exchange approval/licence. Its published terms also say it does not provide market data for gaming, virtual trading or simulation usage. Since ZENURA IGNITE includes paper trading, do not integrate TrueData into that feature unless TrueData and the exchanges provide explicit written confirmation that this exact use case is permitted. A free 15-minute delayed Workspace plan is not API access and is not a public redistribution licence.

### Freemium entitlement policy

A separate pure TypeScript policy module now defines:
- Free: paper trading, basic screener and basic company research.
- Future Premium: advanced filters, advanced portfolio analytics and advanced reports/export.
- Live market data: disabled for both plans until provider and exchange permissions explicitly authorize it.

The policy module is not authentication or billing. Never trust a plan value from local storage or browser input for paid access. A production backend must resolve the user's plan from a trusted identity/billing record. Payment collection and subscriptions remain disabled.

## Provider onboarding request

Request a written proposal for a multi-user app with paper-trading simulation and optional future Premium access. Ask the provider to state:
1. Whether public display and redistribution to app end users is permitted.
2. Whether paper trading / virtual portfolio / simulation is permitted.
3. Whether delayed data can be used for that purpose and at what delay.
4. NSE/BSE equity coverage, symbols, historical candles and corporate/fundamental data.
5. Commercial minimum fees, per-user/exchange fees, usage caps and GST.
6. Required exchange agreements, attribution, audit, caching and retention rules.
7. Whether a sandbox/trial can be used for this exact multi-user simulation use case.

## Critical NSE restriction for this product

The NSE Data Sharing & Usage Policy page, updated 11 December 2025, states that Market Data must not be provided to individuals, entities, platforms, apps or websites engaging in online gaming, virtual trading, simulation, fantasy games, or similar activities. The policy definition of Market Data includes live, snapshot, delayed, end-of-day, historical and corporate data. This is a product-level compliance blocker for using NSE-sourced data in ZENURA IGNITE while it includes paper trading/simulation; a normal vendor subscription or a Premium paywall does not override it.

Accordingly:
- Do not integrate NSE-sourced live, delayed, historical or corporate data into the paper-trading/simulation product on the assumption that a vendor subscription is sufficient.
- Do not rely on personal broker API terms; Shoonya's published API terms also prohibit use of its live data for virtual/mock trading apps.
- Keep the quote adapter fail-closed and the liveMarketData entitlement disabled.
- Before any exchange-sourced feed is considered, obtain written, product-specific guidance from the relevant exchange and provider describing the exact app functions, user audience and data use. Do not treat a generic sales quote or trial key as permission.
- Investigate BSE and MCX separately; do not assume NSE policy or vendor permission covers other exchanges.

### Safe development direction while approval is unresolved

Keep the paper-trading simulator operating on clearly labelled synthetic scenario data (generated locally or by a server, not copied from live exchange feeds). Keep real-market research/quote functionality isolated from simulation and disabled until the exchange/provider confirms in writing that the proposed product separation and use are permitted. Historical/replay data must not be assumed exempt: it is included in the policy's Market Data definition.

This is a compliance-oriented engineering gate, not legal advice.
