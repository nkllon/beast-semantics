# Words Matter Ontology: Publishing and Enforcement Plan

## Overview
Enforce a governed semantic layer for grounding, lineage, safety, and precision. Publish immutable, versioned ontologies under nkllon.com with CI gates and private loading to GraphDB. Evaluate fort-desktop against these gates.

## Decisions
- Namespace: immutable, per-term, versioned slash IRIs.
  - Example: https://ns.nkllon.com/words/v1/Agent (terms)
  - Docs root: https://ns.nkllon.com/words/v1/ (HTML via content negotiation)
- Delivery: Cloudflare Pages (static) + Worker (content negotiation; Vary: Accept, ETag, long-cache for /vN/).
- GraphDB: private endpoint (no public read by default). Loader workflow authenticates via secrets.
- Immutability: never mutate published versions; create /vN+1/ with owl:versionIRI; deprecate terms as needed.

## Deliverables
- Ontology modules (`ontology/words-*.ttl`) with base `https://ns.nkllon.com/words/v1/`.
- SHACL shapes (`shapes/words-*.ttl`).
- Build artifacts: `build/words-v1.ttl`, `build/shacl-report.txt`.
- CI workflows: `.github/workflows/ci.yml` (lint, assemble, validate, artifacts).
- Loader workflow: `.github/workflows/load-graphdb.yml` (assemble, validate, load).
- TTL linter: `tools/lint_ttl.py`.
- Vendored cc-sdd: `tools/vendor/cc-sdd` with README usage.
- Mappings: `mappings/*.ttl` (CAA, Spoon, beast-glue, fort-desktop scaffold later).

## CI and Loader
- CI (PR/main):
  - pip install -r requirements.txt
  - python tools/lint_ttl.py
  - python tools/assemble.py → build/words-v1.ttl
  - python tools/validate.py → build/shacl-report.txt (must conform)
  - Upload artifacts
- Loader (manual dispatch):
  - Inputs/secrets: GRAPHDB_URL, REPO_ID
  - Assemble + validate, then POST Turtle to GraphDB statements endpoint

## Cloudflare Delivery
- Pages project serves `site/` (future: pyLODE HTML + JSON-LD context).
- Worker on `ns.nkllon.com/*`:
  - Accept: text/turtle → words-v1.ttl
  - Accept: application/ld+json → words-v1.context.jsonld
  - default → index.html
  - Headers: Vary: Accept, ETag, Cache-Control (immutable versions)

## Fort‑desktop Evaluation Path
- Create `mappings/fort-desktop.ttl` to bind agents, perspectives, activities, RAG events, provenance.
- Derive SHACL profiles from cc-sdd-driven requirements (grounding, lineage, safety, precision).
- SPARQL checks for perspective coverage, grounding/faithfulness scores, provenance completeness.
- Produce an evaluation report (redundant vs critically necessary) with pass/fail metrics.

## Cursor Rules (fort-desktop)
- Research-first: if certainty < 80%, do targeted discovery before asking one high-value question.
- Efficiency: minimal narration; use CODE REFERENCES for existing files; fenced blocks for new code; parallel greps/reads.
- KG gates: PRs must pass TTL lint + pySHACL; update mappings; include SPARQL sanity checks.

## PDCA Checkpoints
- Plan: finalize namespace, delivery, CI/loader, and evaluation gates.
- Do: implement namespace/files, CI, loader, Pages/Worker; scaffold mappings.
- Check: CI green; SHACL conforms; sample SPARQL returns expected coverage; versioned URLs resolve.
- Act: adjust ontology/shapes or mappings; release next version only with additive/deprecating changes; never mutate /vN/.

## Notes
- Multi-domain support: mirror the pattern for louspringer.com as needed (e.g., https://ns.louspringer.com/<onto>/vN/<Term>).
- Future: add pyLODE doc generation and Pages deploy workflow.
