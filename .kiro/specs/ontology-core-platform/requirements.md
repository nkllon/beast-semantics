# Requirements: Ontology Core Platform (common capabilities)

## Goal
Define shared standards, controls, and reusable assets consumed by both specs:
- Ontology Publishing (static, CDN-first)
- Ontology Runtime Queries (private, gated)

## Scope
- In-scope: versioning policy, artifact layout, validation gates, metadata, Cloudflare baseline controls, config schema, observability, performance budgets, release workflow conventions, shared templates.
- Out-of-scope: concrete publishing worker logic, concrete gateway/store selection (defined in the child specs).

## Requirements
- R1 Versioning & Layout: Use SemVer (X.Y.Z). Artifacts SHALL be stored under `/releases/X.Y.Z/` with `/latest` pointer. Filenames SHALL be deterministic and content-addressable where feasible.
- R2 Validation Gates: CI SHALL enforce RIOT syntax validation, rdflint policy, SPARQL parse/format checks, and SHACL validation (fail on violations). Gates apply to both publishing and runtime source data.
- R3 Metadata: Each release SHALL include VoID and/or DCAT, provenance (git commit, timestamp), SHACL reports, and `CITATION.cff`.
- R4 Config Schema: Define canonical env vars and headers:
  - `SPARQL_ENDPOINT`, `SPARQL_UPDATE_ENDPOINT` (optional), `DATASET_ID`, `GATEWAY_URL`
  - Edge/auth: `AUTH_MODE` (e.g., access|mtls|token), `AUTH_TOKEN_HEADER`
  - Caching: `CACHE_TTL_S` (default), `CACHE_BYPASS_HEADER`
- R5 Cloudflare Baseline: WAF rules, rate limits, TLS, Access policies for admin UIs, request logging enabled, error analytics. These SHALL be documented and referenced by both specs.
- R6 Limits & Safety Defaults: Server timeouts, max results/page, GraphQL depth/complexity caps, request size caps; recommended defaults SHALL be documented.
- R7 Observability: Define required log fields (correlation id, user/session id if available, query id, duration, rows), dashboards (p50/p95 latency, 5xx rate, cache hit ratio), and alert thresholds. Both specs SHALL adopt these.
- R8 Performance Budgets: Baseline budgets (configurable): e.g., p95 < 250 ms at low RPS; document how to measure and exceptions process.
- R9 Release Workflow: On git tag, pipelines SHALL build, validate, generate metadata, and publish artifacts; runtime datasets SHALL ingest from the same immutable artifacts.
- R10 Reusability: Provide shared templates for GraphQL mappings (HyperGraphQL schema seeds, GraphQL‑LD context seeds), cache key strategy, and example load test scripts to be specialized per project.

## Acceptance
- Both child specs reference this document for versioning, validation gates, config schema, and Cloudflare baseline controls.
- A minimal sample project can consume the shared templates to produce a passing build without additional policy wiring.
- Dashboards and alerts are uniformly defined and reusable across publishing and runtime deployments.


