# Requirements: Ontology Publishing (static, versioned, CDN-first)

## Goal
Publish immutable, versioned ontology artifacts with stable URIs and content negotiation, served via Cloudflare (R2 + Worker + CDN). No runtime server required for public consumption.

This spec adopts and references the shared policies in `ontology-core-platform` (R1–R10) for versioning, validation gates, metadata, Cloudflare baseline, config schema, limits, observability, performance budgets, and release workflow.

## Scope
- In-scope: TTL/JSON-LD/HTML docs, VoID/DCAT, SHACL reports, SemVer releases, content negotiation, caching.
- Out-of-scope: Public SPARQL/GraphQL endpoints (covered by runtime-queries spec).

## Requirements
- R1 Stable URIs: Canonical IRIs resolve via content negotiation (text/turtle, application/ld+json, text/html).
- R2 Versioning: Releases are immutable; support `/vX.Y.Z/...` plus `/latest` pointer.
- R3 Formats: Publish Turtle, JSON-LD, pyLODE HTML docs; include JSON-LD contexts for key vocabularies.
- R4 Metadata: Publish VoID and/or DCAT describing datasets; include provenance (release time, commit).
- R5 Validation: Include SHACL validation reports for each release; CI fails on errors.
- R6 CI/CD: On git tag, build artifacts and push to Cloudflare R2; invalidate/update `/latest`.
- R7 Edge: Cloudflare Worker performs content negotiation, sets Cache-Control with long TTLs; supports gzip/brotli.
- R8 Durability: Artifacts stored with immutable keys; no overwrites for versioned paths.
- R9 Discoverability: `CITATION.cff` and optional DOI (Zenodo) per release.
- R10 Accessibility: Public GET requires no auth; admin paths protected via Cloudflare Access.

## Acceptance
- A term IRI returns HTML in a browser, TTL when requested with Accept: text/turtle, and JSON-LD for application/ld+json.
- `latest` and a specific SemVer both resolve to correct immutable artifacts.
- SHACL report is published and CI fails if violations are present.
- VoID/DCAT endpoints are accessible and correctly describe the release contents.


