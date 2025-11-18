# Specs Overview: Publishing, Runtime, and Core Platform

This document explains how the three Kiro specs relate and how shared configuration in `.env.sample` flows through the system.

## Specs

- Ontology Core Platform (`.kiro/specs/ontology-core-platform/`)
  - Defines shared standards and controls used by all ontology services.
  - Includes: versioning policy, artifact layout, validation gates (RIOT, rdflint, SPARQL checks, SHACL), metadata (VoID/DCAT, provenance, CITATION.cff), Cloudflare baseline (WAF, Access, rate limits, TLS, logging), config schema, limits/safety defaults, observability (logs/dashboards/alerts), performance budgets, release workflow conventions, and reusable templates.

- Ontology Publishing (`.kiro/specs/ontology-publishing/`)
  - Static, versioned publishing of artifacts (TTL, JSON‑LD, HTML docs, VoID/DCAT, SHACL reports) via Cloudflare (R2 + Worker + CDN).
  - No runtime server for public consumption; immutable releases with `/latest` pointer and content negotiation.
  - Adopts Core Platform standards (R1–R10).

- Ontology Runtime Queries (`.kiro/specs/ontology-runtime-queries/`)
  - Private, gated runtime queries for internal tooling/apps with strong guardrails.
  - Store: Fuseki+TDB2 (OSS default) or GraphDB (licensed). Gateway: HyperGraphQL or GraphQL‑LD.
  - Fronted by Cloudflare (Access, WAF, rate limits, caching). Enforces timeouts, row caps, GraphQL depth/complexity, and observability.
  - Adopts Core Platform standards (R1–R10).

## Shared configuration (`.env.sample`)

These variables are standardized by the Core Platform spec and consumed by tooling:

- `SPARQL_ENDPOINT` — Read endpoint for SPARQL 1.1 queries
  - Used by: HyperGraphQL (`tools/gateways/hypergraphql/config.json`), GraphQL‑LD (example server), validation tools (optional).
- `SPARQL_UPDATE_ENDPOINT` — Write endpoint for SPARQL Update (optional; disabled in prod runtime)
  - Used by: mutation-capable gateways or admin tooling, if enabled.
- `DATASET_ID` — Logical dataset identifier (naming, dashboards, logs)
  - Used by: logging/metrics correlation, dashboards, and runbooks.
- `GATEWAY_URL` — Public GraphQL endpoint URL
  - Used by: clients, docs, and edge caching/persisted query setup.
- `AUTH_MODE` — Edge auth mode (`access` | `mtls` | `token`)
  - Used by: Cloudflare/edge configuration and origin verification.
- `AUTH_TOKEN_HEADER` — Header name carrying bearer tokens (if `token` mode)
  - Used by: gateways/origin auth middleware.
- `CACHE_TTL_S` — Default cache TTL at the edge
  - Used by: Cloudflare Worker/Rules and gateway cache hints.
- `CACHE_BYPASS_HEADER` — Header to bypass cache for admin/debug
  - Used by: edge logic to force origin fetch.

## Flow (high level)

1) Build and validate
   - Assemble ontology/data → `build/*.ttl`
   - Validate: RIOT, rdflint, SPARQL checks, SHACL (fail on violations)
   - Generate JSON‑LD contexts, pyLODE HTML, VoID/DCAT, SHACL reports

2) Publish (on tag)
   - Push immutable artifacts to Cloudflare R2 under `/releases/X.Y.Z/`
   - Update `/latest` pointer
   - Cloudflare Worker serves content with content negotiation and long TTLs

3) Runtime (private)
   - Load the same immutable artifacts into a read‑only dataset (Fuseki+TDB2 or GraphDB)
   - Expose GraphQL via HyperGraphQL or GraphQL‑LD (shaped access)
   - Front with Cloudflare Access, WAF, rate limits, and optional persisted query caching
   - Enforce limits and monitor with standardized logs/dashboards/alerts

## Where to start

- Publishing: follow `.kiro/specs/ontology-publishing/requirements.md` and wire the Worker + R2 upload in CI.
- Runtime: pick store (Fuseki vs GraphDB), then gateway (HyperGraphQL vs GraphQL‑LD). Templates:
  - `tools/gateways/hypergraphql/` (config + schema)
  - `tools/gateways/graphql-ld/` (example server and context guidance)


