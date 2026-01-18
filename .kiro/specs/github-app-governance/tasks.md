# Tasks

## Phase 1 — Implement CI gates
1. Add SPARQL checker script
   - Create `tools/sparql_check.mjs` using `sparqljs` and `sparql-formatter`
   - Parse all `queries/**/*.rq`; warn on format drift; fail on parse errors
2. Wire SPARQL checks into CI
   - Add Node setup, global install of tools; run script in `.github/workflows/ci.yml`
3. Install Apache Jena and validate RDF
   - Download Jena RIOT; validate TTL/TriG/N-Triples/N-Quads across ontology/shapes/mappings/build
4. Add rdflint for RDF lint rules
   - Download `rdflint` fat JAR and run with defaults; non-zero exit fails
5. Add secrets and SCA gates
   - `gitleaks/gitleaks-action@v2` with `--redact`; `pip-audit --strict`

## Phase 2 — Optional hardening
6. Enforce SPARQL formatting
   - Set `ENFORCE_SPQ_FORMAT=true` in workflow to fail on format drift
7. SBOM + vulnerability policy
   - Generate CycloneDX; scan with Trivy or Grype; start warn-only; gate Critical on approval
8. Custom rdflint rules (optional)
   - Add `.rdflint.yml` to codify project vocabulary/style rules
9. Minimal allowlists (only if required)
   - `.gitleaks.toml` and pip-audit ignore entries via PR review

## Documentation
10. Update README
   - Document gates, failure conditions, and remediation steps
