# Requirements Document

## Introduction
Add open-source, actively maintained RDF/TTL/SPARQL lint/validation and security gates to CI while retaining SonarCloud as the PR quality gate with clear, actionable annotations.

## Glossary

- **CI Pipeline**: The continuous integration system implemented via GitHub Actions that validates code changes
- **RIOT**: Apache Jena's RDF I/O Technology validator for RDF/Turtle syntax validation
- **rdflint**: An open-source RDF linting tool that checks structural and style issues in RDF files
- **SPARQL Parser**: The sparqljs-based tool that validates SPARQL query syntax
- **gitleaks**: An open-source secrets scanning tool that detects hardcoded credentials
- **pip-audit**: A Python dependency security scanner that identifies known vulnerabilities
- **reviewdog**: A code review automation tool that posts inline PR comments
- **metrics_diversity**: A domain-specific validation tool that measures diversity metrics
- **OSI-licensed**: Software licensed under an Open Source Initiative approved license
- **CVSS**: Common Vulnerability Scoring System, a standardized vulnerability severity rating
- **SBOM**: Software Bill of Materials, an inventory of software components

## Requirements

### Requirement 1: Licensing and Posture

**User Story:** As a maintainer, I want all added tools to be OSI-licensed and vendor-agnostic so that our pipeline remains sustainable and forkable.

#### Acceptance Criteria

1. THE CI Pipeline SHALL invoke only OSI-licensed tools.
2. IF a proprietary tool is proposed, THEN THE CI Pipeline SHALL reject the proprietary tool unless organization approval exists.

### Requirement 2: CI Environment

**User Story:** As a contributor, I want a fast CI so that feedback is timely.

#### Acceptance Criteria

1. THE CI Pipeline SHALL complete validation jobs within 5 minutes average runtime.
2. THE CI Pipeline SHALL complete validation jobs within 7 minutes for 95th percentile runtime.
3. WHEN THE CI Pipeline installs dependencies, THE CI Pipeline SHALL use caching for Node dependencies and Java dependencies.

### Requirement 3: File Coverage

**User Story:** As a reviewer, I want RDF and SPARQL files checked so that defects are caught at PR time.

#### Acceptance Criteria

1. WHEN THE CI Pipeline executes, THE CI Pipeline SHALL validate all Turtle files in ontology directory, shapes directory, mappings directory, and build directory.
2. WHEN THE CI Pipeline executes, THE CI Pipeline SHALL parse all SPARQL query files in queries directory.
3. WHEN THE CI Pipeline executes, THE CI Pipeline SHALL analyze all SPARQL query files in queries directory.

### Requirement 4: Validators and Linters

**User Story:** As a maintainer, I want reliable validation so that syntax and structural issues fail fast.

#### Acceptance Criteria

1. WHEN RIOT detects a validation error in Turtle files, THEN THE CI Pipeline SHALL fail the validation job.
2. WHEN rdflint detects Fatal level findings, THEN THE CI Pipeline SHALL fail the validation job.
3. WHEN rdflint detects Error level findings, THEN THE CI Pipeline SHALL fail the validation job.
4. WHEN rdflint detects style-level findings, THEN THE CI Pipeline SHALL report warnings without failing the validation job.
5. WHEN THE SPARQL Parser detects parse errors, THEN THE CI Pipeline SHALL fail the validation job.
6. WHEN THE SPARQL Parser detects formatting differences, THEN THE CI Pipeline SHALL report warnings without failing the validation job.

### Requirement 5: PR Ergonomics

**User Story:** As a reviewer, I want inline comments so that I can fix issues in-context.

#### Acceptance Criteria

1. WHEN THE CI Pipeline produces diagnostics, THEN reviewdog SHALL create inline PR annotations.
2. WHEN THE CI Pipeline detects errors, THEN THE CI Pipeline SHALL report failure status via github-pr-check reporter.
3. WHEN THE CI Pipeline detects warnings only, THEN THE CI Pipeline SHALL report success status via github-pr-check reporter.

### Requirement 6: Security and Compliance

**User Story:** As a security steward, I want secrets and high/critical CVEs blocked so that we minimize risk.

#### Acceptance Criteria

1. WHEN gitleaks detects a secret, THEN THE CI Pipeline SHALL fail the security job.
2. WHEN pip-audit detects vulnerabilities with CVSS score 7.0 or higher, THEN THE CI Pipeline SHALL fail the security job.
3. WHERE SBOM scanning is enabled, IF THE CI Pipeline detects Critical findings, THEN THE CI Pipeline SHALL fail the security job.

### Requirement 7: Domain Policy

**User Story:** As a project owner, I want domain metrics enforced so that regressions are prevented.

#### Acceptance Criteria

1. WHEN metrics_diversity detects a regression compared to the main branch, THEN THE CI Pipeline SHALL fail the validation job unless the threshold has been explicitly adjusted.

### Requirement 8: Reproducibility

**User Story:** As a maintainer, I want deterministic builds so that results are repeatable.

#### Acceptance Criteria

1. THE CI Pipeline SHALL use pinned versions for all tools and dependencies in GitHub Actions.
2. THE CI Pipeline SHALL require no external secrets beyond GitHub token.
3. WHEN THE CI Pipeline executes Node tools, THE CI Pipeline SHALL use --no-fund flag and --no-audit flag.

### Requirement 9: Outputs

**User Story:** As a contributor, I want clear signals so that I can act quickly.

#### Acceptance Criteria

1. WHEN THE CI Pipeline completes execution, THE CI Pipeline SHALL display a concise pass or fail summary.
2. THE CI Pipeline annotation SHALL include file path in each annotation.
3. THE CI Pipeline annotation SHALL include line number in each annotation.
4. THE CI Pipeline annotation SHALL include column number in each annotation.

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
