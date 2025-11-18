# Draft: HyperGraphQL persisted queries and limits

Context: Provide first-class patterns for persisted queries, depth/complexity limits, and pagination to harden HyperGraphQL in production.

Proposals
- Persisted queries: support GET endpoints with hashed query ids; reject ad‑hoc POST unless whitelisted.
- Limits: configuration for max depth/complexity and server‑side timeout/default page size.
- Pagination: recommend cursor-based pagination with stable ordering; example mapping for common RDF patterns.
- Observability: include correlation id and query id in logs; expose simple /metrics counters for latency and errors.

Impact
- Safer default posture, easier Cloudflare edge caching, and better operability at scale.


