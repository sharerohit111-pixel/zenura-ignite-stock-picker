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
