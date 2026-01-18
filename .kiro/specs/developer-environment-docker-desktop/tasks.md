# Tasks

## Phase 1 — Implement CI gates
- [x] 1. Add SPARQL checker script
  - [x] 1.1 Create `tools/sparql_check.mjs` using `sparqljs` and `sparql-formatter`
  - [x] 1.2 Parse all `queries/**/*.rq`; warn on format drift; fail on parse errors
- [ ] 2. Wire SPARQL checks into CI
  - [x] 2.1 Add Node setup, global install of tools; run script in `.github/workflows/ci.yml`
- [ ] 3. Install Apache Jena and validate RDF
  - [x] 3.1 Download Jena RIOT; validate TTL/TriG/N-Triples/N-Quads across ontology/shapes/mappings/build
- [ ] 4. Add rdflint for RDF lint rules
  - [x] 4.1 Download `rdflint` fat JAR and run with defaults; non-zero exit fails
- [ ] 5. Add secrets and SCA gates
  - [x] 5.1 Use `gitleaks/gitleaks-action@v2` with `--redact`; `pip-audit --strict`

## Phase 2 — Optional hardening
- [ ] 6. Enforce SPARQL formatting
  - [ ] 6.1 Set `ENFORCE_SPQ_FORMAT=true` in workflow to fail on format drift
- [ ] 7. SBOM + vulnerability policy
  - [ ] 7.1 Generate CycloneDX; scan with Trivy or Grype; start warn-only; gate Critical on approval
- [ ] 8. Custom rdflint rules (optional)
  - [ ] 8.1 Add `.rdflint.yml` to codify project vocabulary/style rules
- [ ] 9. Minimal allowlists (only if required)
  - [ ] 9.1 `.gitleaks.toml` and pip-audit ignore entries via PR review

## Documentation
- [ ] 10. Update README
  - [x] 10.1 Document gates, failure conditions, and remediation steps
