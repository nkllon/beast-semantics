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

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Dual-channel retrieval completeness
*For any* query, when both lexical and dense retrieval are enabled, the system should return results from both channels with valid scores (s_lex and s_den in [0,1])
**Validates: Requirements R-RET**

### Property 2: Evidence completeness
*For any* decision made by the system, the emitted evidence JSON should contain all required fields: policy_version, query_raw, retrieval hits with scores, metadata, features φ, constraints C, score s, thresholds τ and Δ, decision, and seeds
**Validates: Requirements R-EVD**

### Property 3: Constraint enforcement
*For any* candidate that violates any constraint (non-OSI license OR CVSS ≥ 7.0 OR days_since_release > window OR inaccessible Fort path), the system should not Accept that candidate
**Validates: Requirements R-CST**

### Property 4: Decision rule correctness
*For any* set of candidates and policy parameters, the decision should be Accept if and only if: C(x₁) = true AND s(x₁) ≥ τ AND s(x₁) - s(x₂) ≥ Δ; otherwise the decision should be Abstain
**Validates: Requirements R-DEC**

### Property 5: LLM output schema validation
*For any* LLM-generated output (query expansion or metadata extraction), the output must validate against the strict JSON schema before being used in the decision process
**Validates: Requirements R-LLM**

### Property 6: Policy version tracking
*For any* decision, the evidence JSON should record the exact policy version (from `.kiro/steering/policy.reuse.yml`) that was used to make that decision
**Validates: Requirements R-POL**

### Property 7: Preflight enforcement
*For any* execution, if preflight checks fail (FORT_DESKTOP missing OR index stale OR required packages missing), the system should abort with an actionable error message before attempting any decision
**Validates: Requirements R-PFL**

### Property 8: Network-free operation
*For any* execution in CI mode, the system should complete without making external network calls, falling back to Abstain if network-dependent components (embeddings, LLM) are unavailable
**Validates: Requirements R-OPS**

### Property 9: TF-IDF calculation correctness
*For any* document d and query q, the TF-IDF calculation should follow the exact formula: s_lex(q,d) = (v_q · v_d) / (||v_q|| · ||v_d||) where v contains tf·idf weights
**Validates: Requirements Mathematical Specification (1)**

### Property 10: Hybrid score calculation
*For any* query q and document d with both lexical and dense scores available, the hybrid score should satisfy: s_hyb(q,d) = α·s_lex(q,d) + (1-α)·s_den(q,d) exactly
**Validates: Requirements Mathematical Specification (3)**

### Property 11: Decision determinism
*For any* query and candidate set, given the same policy parameters and random seeds, the system should produce identical decisions and scores across multiple executions
**Validates: Requirements Non-Functional (Reproducibility)**

### Property 12: Constraint logic correctness
*For any* candidate x, the constraint evaluation C(x) should equal: (l_osi = 1) ∧ (p_cve = 0) ∧ (days_since_release ≤ window), computed correctly from the candidate's metadata
**Validates: Requirements Mathematical Specification (4)**

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

## Testing Strategy

### Unit Testing
- Test individual components: TF-IDF calculation, constraint checking, score computation
- Test edge cases: empty queries, missing metadata, boundary values for thresholds
- Test error handling: invalid policy files, malformed evidence, schema validation failures
- Test specific examples: known OSS libraries, Fort artifacts, constraint violations

### Property-Based Testing
- Use **fast-check** (JavaScript/Node.js) for property-based testing
- Configure each property test to run minimum 100 iterations
- Each property test must be tagged with: `**Feature: reuse-decisioning-policy-and-engine, Property {number}: {property_text}**`
- Focus on:
  - Mathematical correctness (TF-IDF, hybrid scoring, constraint logic)
  - Decision rule invariants (determinism, constraint enforcement)
  - Evidence completeness and schema validation
  - Preflight and fallback behavior

### Integration Testing
- Test end-to-end flows: query → retrieval → decision → evidence
- Test with real Fort corpus samples
- Test policy file loading and version tracking
- Test CLI commands and output formats

### Evaluation Testing
- Maintain labeled holdout set in `.kiro/eval/reuse/*.json`
- Measure precision on accept decisions (target ≥ 0.90)
- Track recall and abstain rates
- Run evaluation harness on policy changes

## Risks and Mitigations
- Risk: Dense retrieval drift or model mismatch → Mitigate with hybrid scoring and fall back to lexical-only; abstain if confidence low.
- Risk: Metadata extraction errors → Strict schema validation; require citations; abstain on failure.
- Risk: Policy mis-tuning → Shadow mode, eval reports, reviewer approval for policy bumps.


