# Requirements: Reuse Decisioning Policy and Engine

## Goal
Achieve ≥ 90% decision accuracy (precision on accept decisions) for “use existing OSS or Fort artifact vs. invent new” under auditable, reproducible processes, combining deterministic constraints with a constrained non‑deterministic assist. Always abstain when confidence is insufficient.

## Functional Requirements
1) Retrieval (R-RET)
   - Provide dual-channel retrieval:
     - Lexical sparse retrieval (TF‑IDF/BM25) over Fort.
     - Optional dense retrieval (local embeddings) over the same corpus.
   - Return top‑k candidates with scores and file paths.

2) Evidence (R-EVD)
   - Emit `decision.evidence.json` per decision with:
     - Inputs: query, timestamp, policy version.
     - Retrieval hits: {path, score_lex, score_dense, score_hybrid}.
     - Extracted package metadata (if any) and Fort refs.
     - Final score components and deterministic acceptance result.

3) Constraints (R-CST)
   - Hard gates (all must pass):
     - OSI-approved license.
     - Last release recency ≤ 180 days (configurable).
     - Security: no CVE with CVSS ≥ 7.0 (configurable).
     - Fort path accessible (if required by policy).

4) Decision Rule (R-DEC)
   - Compute scalar decision score s(x) = w · φ(x) with margin Δ against runner-up.
   - Accept iff R-CST holds AND s(x_top) ≥ τ AND s(x_top) − s(x_second) ≥ Δ; else Abstain.

5) Non-deterministic Assist (R-LLM)
   - Use a constrained LLM step for:
     - Query expansion (synonyms, library aliases) at temperature ≤ 0.2.
     - Metadata extraction into strict JSON schema (license, recency, CVEs, popularity, API fit).
   - All LLM outputs must be schema-validated and cited to sources in evidence.

6) Policy as Code (R-POL)
   - Store thresholds (k, α, τ, Δ), weights w, constraint windows, and required fields in `.kiro/steering/policy.reuse.yml` with version, owner, and expiry.
   - Evidence records the policy version used.

7) Preflight (R-PFL)
   - Deterministic preflight enforces:
     - `FORT_DESKTOP` present and accessible.
     - Reuse index freshness ≤ N days.
     - Required OSS packages present.
   - Failing preflight aborts with actionable error.

8) Evaluation (R-EVL)
   - Maintain labeled holdout set.
   - Tune k, α, τ, Δ, and w to meet:
     - Precision_accept ≥ 0.90 on holdout.
     - Track Recall and Abstain rate; abstain preferred over incorrect accept.

9) Governance (R-GOV)
   - Policy changes require reviewer approval with attached eval report.
   - Shadow-mode rollout; promote only if metrics improve or match with lower abstain/cost.

10) Operations (R-OPS)
   - All components runnable locally and in CI; no mandatory network calls.
   - Fall back to abstain on degraded mode (no embeddings/LLM).

## Mathematical Specification
Let:
 - Corpus D = {d_i} of Fort documents/chunks; |D| = N.
 - Vocabulary V from tokens in D.
 - Query q (possibly LLM-expanded to q′).

1) Lexical TF‑IDF
 - Tokenization t: text → multiset of terms over V.
 - For document d with tokens T_d and query q with tokens T_q:
   - tf_d(t) = count(t, T_d) / |T_d|
   - df(t) = |{ d ∈ D : t ∈ T_d }|
   - idf(t) = log((N + 1) / (df(t) + 1)) + 1
   - w_d(t) = tf_d(t) · idf(t); w_q(t) = tf_q(t) · idf(t)
 - Sparse vectors:
   - v_d = [w_d(t_1), …, w_d(t_|V|)], v_q analogously (store as sparse lists)
 - Cosine similarity:
   - s_lex(q, d) = (v_q · v_d) / (||v_q|| · ||v_d||)

2) Dense Retrieval (optional)
 - Embedding function e(·) → ℝ^m (local model).
 - Normalize: ê = e / ||e||
 - Similarity:
   - s_den(q, d) = ê(q) · ê(d)

3) Hybrid Score
 - α ∈ [0,1]:
   - s_hyb(q, d) = α · s_lex(q, d) + (1 − α) · s_den(q, d)

4) Feature Vector φ(x)
For top candidate x (a package or Fort artifact) with retrieved evidence:
 - φ includes:
   - Retrieval features: s_lex, s_den, s_hyb, rank positions, score gaps.
   - Popularity: normalized stars/downloads (z-scored).
   - Recency: r = σ(β · (days_since_release_max − days_since_release(x))) with σ logistic.
   - Security: penalty p_cve = 1{CVSS ≥ 7.0}.
   - License: l_osi = 1{OSI-approved}.
   - Fort similarity: max s_hyb across Fort hits related to x.
 - Deterministic constraints set C(x) = (l_osi = 1) ∧ (p_cve = 0) ∧ (days_since_release ≤ window).

5) Decision Score and Rule
 - Linear score: s(x) = w · φ(x)
 - Let x₁ be top, x₂ second:
   - Accept iff C(x₁) ∧ [s(x₁) ≥ τ] ∧ [s(x₁) − s(x₂) ≥ Δ]
   - Else Abstain

6) Accuracy Targets
 - On holdout H with labels {Accept/Abstain/Reject}:
   - Precision_accept = TP_accept / (TP_accept + FP_accept) ≥ 0.90
   - Report Recall_accept = TP_accept / (TP_accept + FN_accept)
   - Minimize Abstain subject to precision target.

7) Calibration Procedure
 - Grid search on (k, α, τ, Δ) and fit w (e.g., logistic regression or calibrated linear weights) on training set T; validate on H.
 - Select parameters satisfying Precision_accept ≥ 0.90 with lowest Abstain.
 - Freeze policy version; record in repo.

8) Self-Consistency (optional)
 - Partition D into M shards; compute decision across shards; require consensus rate γ (e.g., ≥ 0.8) else Abstain.

## Non-Functional Requirements
 - Reproducibility: All randomness seeded; record seeds in evidence.
 - Performance: P95 end-to-end ≤ 1s on local corpora of ≤ 100k chunks (no LLM), ≤ 3s with LLM assist.
 - Security: No external network calls in CI by default; LLM/embeddings must run locally or via org-approved endpoints.
 - Observability: Log inputs, timings, and decision outcomes; redact secrets.

## Evidence Schema (summarized)
 - version, policy_version, timestamp
 - query_raw, query_expanded[]
 - retrieval: [{path, s_lex, s_den?, s_hyb}]
 - metadata: {license, recency_days, stars, downloads, cves[]}
 - features φ, constraints C, score s, τ, Δ
 - decision: {Accept|Abstain}, rationale
 - seeds, host, corpus_root

## Acceptance Tests (Scenarios)
 - GIVEN a well-known OSS library fulfilling constraints WHEN queried THEN Accept with citations and s ≥ τ and margin ≥ Δ.
 - GIVEN outdated or high-CVE candidates WHEN queried THEN Abstain with constraint failure logged.
 - GIVEN synonyms-only query WHEN dense enabled THEN FN decreases vs. lexical-only; if still ambiguous THEN Abstain.
 - GIVEN missing Fort index or packages WHEN preflight runs THEN fail with actionable error, no decision made.
