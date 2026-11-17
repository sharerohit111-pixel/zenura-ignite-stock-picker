# Financial data architecture

This module defines provider-neutral contracts. It deliberately contains no real or illustrative market quote payloads.

## Equity identity and listings
- `CompanyIdentity` represents the underlying issuer. Use ISIN as the preferred cross-exchange deduplication key when available.
- `EquityListing` represents one exchange-specific listing. NSE and BSE listings can point to the same `companyId`; never create duplicate issuer profiles merely because symbols differ.
- Preserve symbol history with `validFrom`/`validTo`. Do not overwrite a symbol change without retaining its effective dates.
- Conflicting or absent ISINs must remain `PROVISIONAL`/`CONFLICT` until reconciled against an approved source.

## Metric observations
Every observation records metric key, value, unit/currency, period type and end, source/provider, source retrieval/publication timestamps, ingestion timestamp and validation status. Keep raw provider payloads separately and link them with `rawPayloadId`.

### Period rules
- Annual and quarterly values are reported periods, not interchangeable.
- TTM is a rolling trailing twelve-month value and must not be silently substituted with the latest financial year.
- Balance-sheet metrics are point-in-time values. Income/cash-flow metrics are period flows.
- Derived calculations must use compatible consolidation basis, currency, units and period boundaries. Store the formula/methodology version used.
- Market observations use `INSTANT` and an explicit quote timestamp. Never label a quote “Live” unless its source and freshness policy verify that claim.

## Metric catalogue
`metric-catalog.ts` defines 60+ core metrics, labels, units, descriptions, formulas and required inputs. Provider-specific definitions (for example EBITDA, debt, EBIT, capital employed, promoter pledge denominator) must be normalized and documented before comparisons are made.

## Missing and invalid data
- Missing is `null` with status `MISSING`; it is not zero.
- Zero denominators, negative/zero EPS in P/E, non-positive EPS growth in PEG, and incompatible periods return unavailable/not meaningful rather than fabricated ratios.
- Stale, unverified or rejected values remain visibly marked and are excluded from trusted scoring by policy.
- Never calculate a complete company score from incomplete inputs without showing coverage and `PARTIAL` status.

## Quality score policy
Use a versioned methodology with explicit component weights and explanations. Re-normalize weights only over valid components, expose coverage, and return `INSUFFICIENT_DATA` when no valid component exists. A score is a research aid, not a recommendation or guarantee.

## Data provider and licensing
A `DataSourceRecord` must record provider, dataset, licence review, redistribution rights and attribution requirements. Do not ingest or redistribute a provider dataset until commercial terms permit the intended use.

## Commodities isolation
`CommodityInstrument` and `CommodityQuote` are separate from company/listing contracts. Contract identity includes venue, contract code, expiry, lot size, tick size and quote/contract units. Only verified active contract masters should appear as tradable contracts; historical/expired contracts remain distinguishable. Commodity quote data must carry source and as-of time.

## Current implementation boundary
These are typed contracts and safe calculation helpers only. No NSE/BSE master, exchange feed, financial statements, commodity contract master, provider credentials or backend persistence is included yet.
