# Tasks

## Phase 1 — Core Retrieval, Policy, and Decision
- [ ] 1. Add policy file
  - Create `.kiro/steering/policy.reuse.yml` with defaults: k, α, τ, Δ, recency_days, cve_threshold, weights w, seed
- [ ] 2. Enhance lexical indexer
  - Support configurable include/exclude globs, chunk sizing, and reproducible ordering in `tools/reuse_index.mjs`
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


