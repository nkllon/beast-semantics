#!/usr/bin/env python3
import sys
import os

KIRO_DIR = ".kiro"

DESIGN_CONTENT = """# Design Document

## Overview
Augment CI with OSS validators for RDF/TTL/SPARQL and security gates while keeping SonarCloud as the PR quality gate. Provide fast feedback, clear signals, and vendor-agnostic checks.

## Architecture
- CI runner: GitHub Actions
- Languages/tools:
  - RDF/Turtle validation: Apache Jena RIOT (Apache-2.0)
  - RDF lint rules: rdflint (Apache-2.0)
  - SPARQL parse/format: sparqljs + sparql-formatter (MIT)
  - Secrets scanning: gitleaks (MIT, GitHub Action)
  - Python SCA: pip-audit (Apache-2.0)
  - (Optional Phase 2) SBOM + scan: CycloneDX + Trivy/Grype

## File Coverage
- RDF/Turtle family:
  - `ontology/**/*.ttl`, `shapes/**/*.ttl`, `mappings/**/*.ttl`, `build/**/*.ttl`
  - (Also allow TriG/N-Triples/N-Quads where present)
- SPARQL:
  - `queries/**/*.rq`

## CI Workflow Additions (implemented)
1) Setup runtimes
   - Java via actions/setup-java (Temurin 21)
   - Node via actions/setup-node (Node 20, npm cache)
2) SPARQL tools
   - Install `sparqljs`, `sparql-formatter` (global)
   - Run `tools/sparql_check.mjs queries` (parse errors fail; formatting warns by default; set `ENFORCE_SPQ_FORMAT=true` to enforce)
3) RDF validation
   - Install Apache Jena RIOT; run `riot --validate` per file across ontology/shapes/mappings/build; any error fails
4) RDF lint
   - Download `rdflint` fat JAR; run defaults; non-zero exit fails; style remains warnings within tool output
5) Security/compliance
   - Secrets: `gitleaks/gitleaks-action@v2` with `--redact` (fail on findings)
   - Python SCA: `pip-audit --strict` over `requirements.txt` (fail on High/Critical, CVSS ≥ 7)

## Severity Mapping
- Errors (fail job):
  - RIOT validation errors; SPARQL parse errors; gitleaks findings; High/Critical in pip-audit
- Warnings (do not fail initially):
  - SPARQL formatting drift; rdflint style-level findings
- Toggle:
  - Set `ENFORCE_SPQ_FORMAT=true` to elevate SPARQL formatting to error

## Performance & Caching
- actions/setup-node cache: npm
- Minimize downloads; per-file RIOT validation to localize failures
- Expected overhead: ≤ 3–4 minutes typical

## Configuration (optional, future)
- `.gitleaks.toml` for allowlist only when necessary
- `.rdflint.yml` for custom rules/vocabulary checks
- Minimal, reviewed ignore list for pip-audit

## Out of Scope
- Building SonarQube plugins
- Replacing SonarCloud
- IDE-specific plugins
"""


def main() -> int:
	if len(sys.argv) != 2:
		print("Usage: tools/kiro_spec_design.py <feature-name>", file=sys.stderr)
		return 2
	feature = sys.argv[1]
	target = os.path.join(KIRO_DIR, "specs", feature, "design.md")
	if not os.path.isdir(os.path.dirname(target)):
		print(f"ERROR: Spec directory not found: {os.path.dirname(target)}", file=sys.stderr)
		return 2
	with open(target, "w", encoding="utf-8") as f:
		f.write(DESIGN_CONTENT)
	print(f"== Design written ==\n{target}")
	return 0


if __name__ == "__main__":
	sys.exit(main())


