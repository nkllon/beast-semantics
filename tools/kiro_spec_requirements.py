#!/usr/bin/env python3
import sys
import os

KIRO_DIR = ".kiro"

REQUIREMENTS_CONTENT = """# Requirements Document

## Introduction
Add open-source, actively maintained RDF/TTL/SPARQL lint/validation and security gates to CI while retaining SonarCloud as the PR quality gate with clear, actionable annotations.

## Requirements

### Requirement 1: Licensing and Posture
**Objective:** As a maintainer, I want all added tools to be OSI-licensed and vendor-agnostic so that our pipeline remains sustainable and forkable.

#### Acceptance Criteria
1. WHEN CI runs THEN only OSI-licensed tools are invoked.
2. IF a proprietary tool is proposed THEN it SHALL be rejected unless already org-approved (e.g., SonarCloud).

### Requirement 2: CI Environment
**Objective:** As a contributor, I want a fast CI so that feedback is timely.

#### Acceptance Criteria
1. WHEN the added jobs run THEN total runtime SHALL be ≤ 5 min average and ≤ 7 min P95.
2. WHEN dependencies are installed THEN caches SHALL be used for Node/Java where applicable.

### Requirement 3: File Coverage
**Objective:** As a reviewer, I want RDF and SPARQL files checked so that defects are caught at PR time.

#### Acceptance Criteria
1. WHEN CI runs THEN validate `ontology/**/*.ttl`, `shapes/**/*.ttl`, `mappings/**/*.ttl`, `build/**/*.ttl`.
2. WHEN CI runs THEN parse and analyze `queries/**/*.rq`.

### Requirement 4: Validators and Linters
**Objective:** As a maintainer, I want reliable validation so that syntax and structural issues fail fast.

#### Acceptance Criteria
1. WHEN RIOT validates TTL-family files THEN any error SHALL fail the job.
2. WHEN rdflint runs THEN Fatal/Error SHALL mark errors; style SHALL be warnings initially.
3. WHEN SPARQL is parsed (sparqljs/analyzer) THEN parse errors SHALL fail; formatting differences SHALL warn initially.

### Requirement 5: PR Ergonomics
**Objective:** As a reviewer, I want inline comments so that I can fix issues in-context.

#### Acceptance Criteria
1. WHEN diagnostics are produced THEN reviewdog SHALL annotate PRs.
2. WHEN errors occur THEN `github-pr-check` SHALL report failure; warnings SHALL not fail.

### Requirement 6: Security and Compliance
**Objective:** As a security steward, I want secrets and high/critical CVEs blocked so that we minimize risk.

#### Acceptance Criteria
1. WHEN gitleaks finds a secret THEN the job SHALL fail.
2. WHEN pip-audit detects High/Critical (CVSS ≥ 7.0) THEN the job SHALL fail.
3. WHEN SBOM scanning is enabled (Phase 2) THEN Critical findings SHALL fail once policy is approved.

### Requirement 7: Domain Policy
**Objective:** As a project owner, I want domain metrics enforced so that regressions are prevented.

#### Acceptance Criteria
1. WHEN metrics_diversity runs THEN any regression vs `main` SHALL fail unless threshold is explicitly adjusted.

### Requirement 8: Reproducibility
**Objective:** As a maintainer, I want deterministic builds so that results are repeatable.

#### Acceptance Criteria
1. WHEN actions run THEN pinned versions SHALL be used and no external secrets are required beyond `${{ secrets.GITHUB_TOKEN }}`.
2. WHEN Node tools run THEN use `--no-fund --no-audit`.

### Requirement 9: Outputs
**Objective:** As a contributor, I want clear signals so that I can act quickly.

#### Acceptance Criteria
1. WHEN CI completes THEN a concise pass/fail summary SHALL be present.
2. WHEN annotations occur THEN they SHALL reference file and line/column.

### Out of Scope
- Building SonarQube plugins
- Replacing SonarCloud
- IDE-specific integrations

## Acceptance Test Scenarios
1. GIVEN an invalid `.ttl` WHEN CI runs THEN RIOT fails and a PR annotation points to the line/col.
2. GIVEN an unparsable `.rq` WHEN CI runs THEN SPARQL parse fails and an annotation shows the token/offset.
3. GIVEN a committed secret WHEN CI runs THEN gitleaks fails; after removal, pipeline passes.
4. GIVEN a dependency with a High CVE WHEN CI runs THEN pip-audit fails; after upgrade, passes.
5. GIVEN formatting-only SPARQL drift WHEN CI runs THEN warnings appear but job does not fail (Phase 1).
6. GIVEN a domain metrics regression vs `main` WHEN CI runs THEN the job fails until threshold is adjusted.
"""


def main() -> int:
	if len(sys.argv) != 2:
		print("Usage: tools/kiro_spec_requirements.py <feature-name>", file=sys.stderr)
		return 2
	feature = sys.argv[1]
	req_path = os.path.join(KIRO_DIR, "specs", feature, "requirements.md")
	if not os.path.isfile(req_path):
		print(f"ERROR: Spec requirements file not found: {req_path}", file=sys.stderr)
		return 2
	with open(req_path, "w", encoding="utf-8") as f:
		f.write(REQUIREMENTS_CONTENT)
	print(f"== Requirements written ==\n{req_path}")
	return 0


if __name__ == "__main__":
	sys.exit(main())


