# ZENURA IGNITE — Backend, Authentication and Security Plan

## Purpose and release boundary

This document is an implementation plan, not a claim that a backend or authentication service is already deployed. The current production site is a static GitHub Pages PWA. It must not contain provider credentials, private signing keys, database credentials or privileged API tokens.

The product name is **ZENURA IGNITE** and its subtitle is **Paper Trading & Paper Investing**. The current feature set is a research prototype; paper-trading order execution/simulation and investing workflows are not implemented merely by displaying this subtitle. Keep any future paper portfolio and order simulator separate from live brokerage/exchange execution.

## Target architecture

1. **PWA frontend (GitHub Pages initially):** presentation, input validation and non-sensitive user interactions only. Treat all browser storage as user-controlled and non-confidential.
2. **Application API (server-side):** authenticated endpoints, authorization, schema validation, rate limiting, request IDs and audit events. The API is the only frontend-facing boundary for private data.
3. **Identity adapter:** phone OTP as the primary planned sign-in method; email/Google can be added only after the identity provider, account-linking rules and recovery flow are selected and tested. Do not build custom password/OTP cryptography.
4. **Database:** user profiles, preferences, watchlists, research notes, paper portfolios and audit metadata. Enforce ownership at the database/API layer, not only in UI route guards.
5. **Market-data adapter:** provider-specific adapters normalize into the existing provider-neutral data contracts. Store source, licence reference, as-of/retrieved timestamps, currency, units, period and validation state with every observation.
6. **Background ingestion/cache:** scheduled provider pulls, retry/backoff, freshness monitoring, deduplication and provider outage handling. No market-data credentials in frontend bundles.

## Authentication and session controls

- Use a managed identity provider that supports Indian phone OTP and the chosen account recovery flow; document SMS pricing, delivery limits and abuse controls before selection.
- Verify OTP and identity tokens on the server. Never trust a user ID supplied by the browser.
- Prefer secure, HttpOnly, SameSite cookies for web sessions; set Secure in production. If a chosen provider requires a different supported session pattern, document the threat trade-off before implementation.
- Protect state-changing cookie-authenticated requests against CSRF; validate Origin/Host and use an explicit CORS allowlist.
- Apply per-IP, per-phone and per-account OTP/request throttles, resend cooldowns, attempt limits and abuse monitoring. Do not reveal whether a phone number already has an account.
- Add account linking only after proving control of both identities. Provide sign-out, session revocation and account deletion/export policy.
- Keep development authentication bypass separate and explicitly disabled in production. Do not enable login until OTP, recovery, authorization and end-to-end tests pass.

## API and data security

- Validate every request and response against typed schemas; reject unknown or malformed identity, metric, period and unit fields.
- Authorize every record by authenticated owner ID. Test cross-user access denial for watchlists, notes, reports and paper portfolios.
- Store secrets in the backend platform's secret manager; rotate them and restrict each key to the minimum required scopes.
- Enforce HTTPS, security headers, dependency scanning, least-privilege service accounts, database backups and restore drills.
- Redact OTPs, access tokens, provider secrets and sensitive personal data from logs. Keep auditable event metadata without recording secrets.
- Define retention, export, deletion and incident-response procedures before public account launch.

## Market-data provider gate

Before implementation, select a provider and obtain written confirmation of:
- Indian equity coverage (NSE/BSE) and required company master/listing/ISIN fields.
- Fundamentals, annual/quarterly/TTM statements and corporate-action adjustments.
- Commodity coverage and contract master, if commodities are in release scope.
- Real-time/delayed/historical entitlements, rate limits, attribution and display/redistribution rights for this app's intended audience and monetization.
- Production credentials, sandbox, uptime/support terms and cost.

Until this gate is complete, show demo/unverified data as such and never label it live. Do not scrape exchange sites or bypass access restrictions.

## Phased implementation and acceptance criteria

### Phase A — decisions and sandbox
- Confirm hosting/backend budget, provider, identity provider and data licence.
- Create separate development/staging/production environments and secret stores.
- Document API schemas and threat model.

### Phase B — secure backend foundation
- Health/readiness endpoints, request validation, structured redacted logs, rate limiting and monitoring.
- Database migrations, user ownership constraints and backup/restore test.
- Automated tests for authentication, authorization, CSRF, CORS, throttling and cross-user isolation.

### Phase C — identity and sync
- Phone OTP login, session expiry/revocation, recovery and sign-out.
- Optional email/Google sign-in and safe account linking.
- Cloud watchlist and notes with migration-safe sync; retain local-only mode until sync passes tests.

### Phase D — provider integration
- Provider adapter and sandbox fixtures; reconcile company identity and listing records.
- Persist source metadata and run freshness/licence validation before exposing values.
- Fail closed on missing/stale/unauthorized data; monitor feed gaps and provider outages.

### Phase E — release gate
- No secrets in built frontend assets or repository history.
- Security and cross-user authorization tests pass.
- Mobile browser, PWA install/update/offline, accessibility and backup restore checks pass.
- Provider display rights and privacy/retention terms are approved.
- Login remains disabled until all identity acceptance tests pass.

## Current blockers / decisions required

- No provider or market-data licence has been selected/verified.
- No backend hosting or database has been selected.
- No managed OTP/identity provider has been selected.
- No production secrets or credentials are available in this repository.

Do not fabricate these dependencies or mark blocked work as complete.
