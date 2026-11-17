# Fundamental Screener

Owns provider-neutral filter evaluation and saved-screen contracts. It must not own provider credentials or directly fetch a third-party provider from the browser.

## Current implementation status
- The filtering engine and its automated tests are implemented.
- A complete filter-builder and results UI is not present in this module yet; do not describe the Screener as a finished user-facing workflow.
- No live market data is fetched. The engine only evaluates observations supplied by the application.

## Engine (`engine.ts`)
- Pure provider-neutral filtering for any of the 60+ `MetricKey` values.
- Numeric operators: greater/greater-equal/less/less-equal/equal/between, plus explicit missing-value selection.
- Optional period selection and verified-only filtering.
- Uses the latest matching observation by `periodEnd`; missing values never coerce to zero.
- Excludes provisional/conflicted company identities by default and reports exclusions.
- Supports deterministic sorting with missing values last.
- Saved screens are version-keyed browser-local records; they are not synced across devices. Invalid stored records are ignored and storage quota/private-mode errors do not crash the feature.
- No network calls, quote generation, or investment recommendations.
