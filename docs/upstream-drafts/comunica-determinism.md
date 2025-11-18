# Draft: Comunica / GraphQL‑LD determinism and cacheability

Context: Improve determinism and cacheability for GraphQL‑LD queries executed via Comunica over SPARQL sources.

Proposals
- Add guidelines and utilities for canonical ordering of bindings for stable JSON output (opt‑in flag).
- Provide an example JSON‑LD context linter to detect ambiguous terms and context drift.
- Support cache hints (e.g., `@cacheTtl`, `@cacheKeyFields`) in GraphQL‑LD queries mapped to HTTP headers for edge caches.
- Add recipe for persisted queries (GET with normalized keys) and reference Worker config.

Impact
- Easier edge caching, reproducible results in CI, and predictable diffs for golden tests.


