# Tasks

## Phase 1 — Core Retrieval, Policy, and Decision
- [ ] 1. Add policy file
  - Create `.kiro/steering/policy.reuse.yml` with defaults: k, α, τ, Δ, recency_days, cve_threshold, weights w, seed
- [x] 2. Enhance lexical indexer
  - Support configurable include/exclude globs, chunk sizing, and reproducible ordering in `tools/reuse_index.mjs`
  - **Status**: Implemented in `tools/reuse_index.mjs`
- [ ] 3. Add hybrid retrieval
  - Add s_hyb to evidence paths; expose α and k via CLI flags and policy
- [ ] 4. Metadata extraction
  - Implement extractor (LLM-assisted optional) that outputs strict JSON: {license, recency_days, cves[], stars, downloads, language, api_fit_bool} with citations
- [ ] 5. Decision engine
  - Compute φ, check C(x), score s = w·φ, margin vs. second-best, Accept/Abstain
  - Persist `decision.evidence.json` with all inputs/outputs
- [ ] 6. Preflight integration
  - Require fresh reuse index; ensure required packages; enforce no-network in CI
- [ ] 7. CLI surfaces
  - `npm run reuse:search -- "<q>"` returns ranked paths with scores
  - `npm run reuse:evidence -- "<q>"` writes evidence and prints decision
  - **Partial**: Core tools exist (`tools/reuse_query.mjs`, `tools/reuse_evidence.mjs`), need CLI wiring

- [ ]* 7.1 Write property test for dual-channel retrieval
  - **Property 1: Dual-channel retrieval completeness**
  - **Validates: Requirements R-RET**

- [ ]* 7.2 Write property test for evidence completeness
  - **Property 2: Evidence completeness**
  - **Validates: Requirements R-EVD**

- [ ]* 7.3 Write property test for constraint enforcement
  - **Property 3: Constraint enforcement**
  - **Validates: Requirements R-CST**

- [ ]* 7.4 Write property test for decision rule correctness
  - **Property 4: Decision rule correctness**
  - **Validates: Requirements R-DEC**

- [ ]* 7.5 Write property test for LLM output schema validation
  - **Property 5: LLM output schema validation**
  - **Validates: Requirements R-LLM**

- [ ]* 7.6 Write property test for policy version tracking
  - **Property 6: Policy version tracking**
  - **Validates: Requirements R-POL**

- [ ]* 7.7 Write property test for preflight enforcement
  - **Property 7: Preflight enforcement**
  - **Validates: Requirements R-PFL**

- [ ]* 7.8 Write property test for network-free operation
  - **Property 8: Network-free operation**
  - **Validates: Requirements R-OPS**

- [ ]* 7.9 Write property test for TF-IDF calculation
  - **Property 9: TF-IDF calculation correctness**
  - **Validates: Requirements Mathematical Specification (1)**

- [ ]* 7.10 Write property test for hybrid score calculation
  - **Property 10: Hybrid score calculation**
  - **Validates: Requirements Mathematical Specification (3)**

- [ ]* 7.11 Write property test for decision determinism
  - **Property 11: Decision determinism**
  - **Validates: Requirements Non-Functional (Reproducibility)**

- [ ]* 7.12 Write property test for constraint logic
  - **Property 12: Constraint logic correctness**
  - **Validates: Requirements Mathematical Specification (4)**

## Phase 2 — Evaluation and Tuning
- [ ] 8. Labeled eval set
  - Curate holdout decisions; store under `.kiro/eval/reuse/*.json`
- [ ] 9. Tuning harness
  - Grid search (k, α, τ, Δ) and fit w (logistic/linear) to hit Precision_accept ≥ 0.90; produce report.md
- [ ] 10. Shadow mode in CI
  - Run decision engine read-only, compare against current policy, record confusion deltas
- [ ] 11. Promotion flow
  - On improvement, bump policy version and commit with eval artifacts

## Phase 3 — Dense Retrieval (Optional)
- [ ] 12. Local embeddings
  - Add dense indexer and retriever (no network); normalize vectors; support hybrid scoring
- [ ] 13. Reranking
  - Add lexical-first candidate generation, dense rerank; measure impact on FN/FP/abstain

## Phase 4 — Documentation and Governance
- [ ] 14. Docs
  - Document policy fields, commands, evidence schema, and decision math in `docs/specs-overview.md` and spec docs
- [ ] 15. Governance
  - Add reviewer checklist and template for policy bumps; link eval report


