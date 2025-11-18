# Design: Reuse Decisioning Policy and Engine

## Overview
Determine when to reuse existing OSS/Fort solutions versus inventing new code with ≥ 90% precision on accept decisions, under strict auditability. The engine couples:
- Deterministic constraints (license, security, recency, provenance)
- Dual-channel retrieval (lexical and optional dense)
- Constrained LLM assists (query expansion, metadata extraction) with schema validation
- A deterministic scoring rule with thresholds and a safe abstain

Outputs are evidence files suitable for CI gates and human review.

## Architecture
- Retrieval layer:
  - TF‑IDF/BM25 indexer over Fort (`tools/reuse_index.mjs`)
  - Optional dense embeddings (local model) indexer (future: `tools/reuse_index_dense.mjs`)
  - Hybrid scorer s_hyb = α·s_lex + (1−α)·s_den
- Orchestration:
  - Query CLI, evidence generation (`tools/reuse_query.mjs`, `tools/reuse_evidence.mjs`)
  - Preflight checks (`tools/preflight.mjs`)
- Policy as code:
  - `.kiro/steering/policy.reuse.yml` stores k, α, τ, Δ, constraint windows, and weights w
- Decision:
  - Feature computation φ; linear score s = w·φ; margin test with runner-up
  - Deterministic Accept/Abstain decision and evidence JSON
- Evaluation:
  - Labeled holdout set; tuning loop; shadow rollout and promotion

## Data Flow
1) Preflight ensures Fort path, index freshness, required packages.
2) Query is optionally LLM-expanded (low temperature) and chunked.
3) Retrieval returns top‑k candidates with s_lex, s_den, s_hyb.
4) Metadata is extracted (license, recency, CVEs, popularity) into a strict JSON schema with citations.
5) Features φ are computed; constraints C checked.
6) Score s(x) computed; margin vs. second-best checked; Accept/Abstain decided.
7) Evidence JSON persisted; CI/pass-fail uses deterministic rule only.

## Mathematical Core (from Requirements, summarized)
- s_lex(q,d) = cosine(tf-idf(q), tf-idf(d))
- s_den(q,d) = ê(q)·ê(d) (optional)
- s_hyb(q,d) = α·s_lex + (1−α)·s_den
- Decision features φ(x): retrieval scores and gaps, popularity (z-scored), recency r, security penalty p_cve, OSI flag, Fort similarity
- Constraints C(x): OSI ∧ no high-CVE ∧ recency window
- Score s(x) = w·φ(x); Accept iff C(x₁) ∧ s(x₁) ≥ τ ∧ s(x₁)−s(x₂) ≥ Δ; else Abstain

## APIs and Schemas
- Policy YAML (`.kiro/steering/policy.reuse.yml`):
  - version, owner, k, α, τ, Δ, recency_days, cve_threshold, weights, seed
- Evidence JSON (`.kiro/evidence/*.json`):
  - policy_version, query_raw/expanded, retrieval hits with scores, metadata, φ, C, s, τ, Δ, decision, seeds, host, corpus_root

## Implementation Notes
- Determinism: record seeds; validate all LLM outputs against JSON schema; no network in CI.
- Performance: sparse retrieval and scoring must complete ≤ 1s on ≤ 100k chunks; LLM assists cached and optional.
- Security: CVE data should be offline/cached or stubbed in CI; otherwise abstain.
- Observability: log timings and decisions; redact secrets.

## Risks and Mitigations
- Risk: Dense retrieval drift or model mismatch → Mitigate with hybrid scoring and fall back to lexical-only; abstain if confidence low.
- Risk: Metadata extraction errors → Strict schema validation; require citations; abstain on failure.
- Risk: Policy mis-tuning → Shadow mode, eval reports, reviewer approval for policy bumps.


