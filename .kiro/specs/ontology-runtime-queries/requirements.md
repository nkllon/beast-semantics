# Requirements: Ontology Runtime Queries (private, gated)

## Goal
Provide controlled, read-only runtime query capabilities over the ontology for internal tooling and selected applications, with strong guardrails and edge protections.

This spec adopts and references the shared policies in `ontology-core-platform` (R1–R10) for versioning, validation gates, metadata, Cloudflare baseline, config schema, limits, observability, performance budgets, and release workflow.

## Scope
- In-scope: SPARQL endpoint (Fuseki+TDB2 default, GraphDB optional), GraphQL gateway (HyperGraphQL or GraphQL‑LD), Cloudflare fronting, limits, observability.
- Out-of-scope: Public anonymous SPARQL prompts; public writes; multi-tenant authoring.

## Requirements
- R1 Store: Default to Fuseki+TDB2 (OSS). GraphDB may be used where licensed.
- R2 Gateway: Shape access via GraphQL (HyperGraphQL or GraphQL‑LD). Raw SPARQL reserved for trusted services only.
- R3 Security: Behind Cloudflare Access (SSO), WAF, and rate limits; mTLS or token between edge and origin.
- R4 Limits: Server-side timeouts, max results, pagination, and per-token quotas; GraphQL depth/complexity caps; no SPARQL Update in prod.
- R5 Caching: Support persisted queries (GET) enabling safe edge caching; cache TTLs configurable; purge on ontology release.
- R6 Isolation: Datasets are read-only snapshots (per release or per env); ingestion via controlled pipeline only.
- R7 Observability: Structured logs, correlation IDs, dashboards (latency p50/p95, error rate), alerts on regressions and saturation.
- R8 DX: Minimal runbook to create a dataset, point the gateway, and secure via Cloudflare; example queries and pagination patterns.
- R9 Performance: Baseline targets (example) p95 < 250 ms @ small RPS with warm cache; configurable in env.
- R10 Compliance: Capture audit trail for admin operations; separate admin endpoints from query endpoints.

## Acceptance
- Authenticated users can execute the example GraphQL queries successfully; anonymous users are blocked by edge policy.
- Limits are enforced (timeouts, row caps, depth caps); oversized queries fail with clear errors.
- Edge caching works for persisted GET queries and purges on a new ontology release.
- Dashboards show live latency/error metrics; alerts trigger on configured thresholds.


