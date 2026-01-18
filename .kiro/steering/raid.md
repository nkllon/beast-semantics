# RAID Log (Risks, Assumptions, Issues, Decisions)

## Risks

### R-0001: Use of Apache Jena (RIOT/SHACL/Fuseki/TDB2) in production
- Description: Operational fragility (JVM/GC pressure, TDB2 sensitivity to unclean shutdowns, complex configuration surface) can degrade availability; heavy validation jobs (RIOT/SHACL) on large datasets risk DoS if exposed; misconfiguration risks can become security issues (auth/timeouts/limits).
- Impact: High (availability/integrity); potential security exposure via misconfig.
- Likelihood: Medium (varies by workload/operational maturity).
- Affected Areas: Gateway backends, CI validation runners, any exposed SPARQL services.
- Mitigations:
  - Prefer Jena for CI validation and local development; avoid as long‑running prod store for public read APIs when possible.
  - If used in prod:
    - Enforce read‑only endpoints for gateways; disable updates.
    - Strict timeouts, max results, query depth/complexity caps; rate limit at edge.
    - TDB2 transactions/journaling enabled; frequent backups; WAL verification; graceful shutdown hooks.
    - Container and JVM tuning (heap/GC), resource limits, liveness/readiness probes.
    - Run RIOT/SHACL offline/CI only; never expose validation endpoints publicly.
  - Alternatives for prod read APIs: GraphDB Free/SE, Oxigraph (OSS).
- Owner: Platform/Knowledge Graph
- Status: Open
- Review Date: 2025-11-18

## Assumptions

### A-0001: Gateways are read-only for initial release
- We assume initial GraphQL gateways perform read-only queries against SPARQL endpoints.

## Issues

### I-0001: None logged

## Decisions

### D-0001: Jena usage posture
- Decision: Use Apache Jena primarily for CI validation and local development; for production read APIs, prefer more robust/managed stores; if Jena is required in production, apply the mitigations in R-0001.
- Date: 2025-11-18
- Related: R-0001


