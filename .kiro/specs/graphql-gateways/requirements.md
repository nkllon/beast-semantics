# Requirements: GraphQL Gateways over SPARQL (HyperGraphQL + GraphQL‑LD/Comunica)

## Goal
Expose read (and optional write) GraphQL APIs over existing SPARQL datasets using:
- HyperGraphQL (Java, config‑driven GraphQL→SPARQL)
- GraphQL‑LD with Comunica (Node.js, GraphQL over JSON‑LD context → SPARQL via Comunica)

## Non‑Goals
- Replace existing SPARQL workflows
- Build a complex, bespoke GraphQL schema generator
- Vendor‑specific features that lock us to a single store

## Requirements

- R1: The gateways SHALL connect to any standards‑compliant SPARQL 1.1 endpoint via `SPARQL_ENDPOINT` (GraphDB or Fuseki).
- R2: Local dev SHOULD be runnable with Docker Desktop (Apple Silicon supported) for HyperGraphQL; GraphQL‑LD MAY run via Node 18+.
- R3: The solution SHALL be OSS and reproducible without external secrets; credentials, if used, SHALL be provided at runtime (headers/env).
- R4: Minimal example schema/context SHALL support: entity lookup by IRI, listing with pagination, labels (`rdfs:label`), and basic property traversal.
- R5: HyperGraphQL config SHALL be provided as a template with a working example schema and service mapping.
- R6: GraphQL‑LD documentation SHALL include a minimal runnable server example (no daemonization required) and a JSON‑LD context example.
- R7: Docs SHALL show how to target GraphDB and Fuseki without code changes (config/env only).
- R8: Optional writes: HyperGraphQL MAY expose mutations mapped to SPARQL Update as an example; disabled by default.
- R9: No CI coupling: running gateways in CI is out‑of‑scope; docs SHALL focus on local dev usage.

## Acceptance
- A developer can start HyperGraphQL pointing at an existing SPARQL endpoint and successfully run the example queries.
- A developer can run the GraphQL‑LD example with Node 18+ and execute the example query against a SPARQL endpoint.
- README sections clearly document configuration, start/stop, and troubleshooting.


