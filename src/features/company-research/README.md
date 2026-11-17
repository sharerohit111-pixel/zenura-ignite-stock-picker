# Company Research

Owns company profile, financial statement views, ratio definitions, reporting-period labels, data provenance, and freshness indicators.

## Data quality utilities
- `data-quality.ts` audits observation traceability against the source registry.
- Freshness is based on source retrieval timestamp, not period end.
- Annual, quarterly, TTM, instant and custom periods remain explicitly labelled.
- Unknown, future-dated or invalid timestamps produce `UNKNOWN`; no freshness is inferred.
- An observation is provenance-complete only when source/provider/dataset, licensing and redistribution/attribution metadata, reporting period, unit, retrieval time and value are present.
- The audit is diagnostic only: it never edits, fills, or upgrades an observation's source status.


## Financial statements

- `financial-statements.ts` groups supplied observations into statement columns without mixing Annual, Quarterly and TTM periods. Missing metrics remain `MISSING` and are never coerced to zero.
- `FinancialStatementsPanel.tsx` provides Income Statement, Balance Sheet and Cash Flow tabs with a reporting-period selector. It intentionally receives an empty observation set until an approved provider is connected.
- Duplicate observations for a metric/period are resolved by latest `sourceRetrievedAt`; original observations are not mutated.
- Currency scaling and cross-provider normalization are intentionally not inferred by this module.
