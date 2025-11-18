# Design Document

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

## Components and Interfaces

### SPARQL Validation Component
- **Input**: Directory path containing `.rq` files
- **Output**: JSON array of findings with file, line, column, severity, message
- **Interface**: Node.js script (`tools/sparql_check.mjs`)
- **Dependencies**: sparqljs, sparql-formatter
- **Exit codes**: 0 (pass), 1 (parse errors), 0 (format warnings only)

### RDF Validation Component
- **Input**: Individual `.ttl`, `.trig`, `.nt`, `.nq` files
- **Output**: RIOT validation messages to stderr
- **Interface**: Apache Jena RIOT CLI (`riot --validate`)
- **Exit codes**: 0 (valid), non-zero (errors)

### RDF Lint Component
- **Input**: Directory paths containing RDF files
- **Output**: rdflint report with severity levels
- **Interface**: Java JAR execution
- **Exit codes**: 0 (pass), non-zero (Fatal/Error findings)

### Security Scanning Components
- **gitleaks**: GitHub Action, scans git history and staged files
- **pip-audit**: Python CLI, scans requirements.txt for CVEs
- **Exit codes**: Both fail (non-zero) on findings

### PR Annotation Component
- **Input**: Validation findings in standardized format
- **Output**: Inline PR comments via GitHub API
- **Interface**: reviewdog (optional, future enhancement)

## Data Models

### Validation Finding
```json
{
  "file": "queries/example.rq",
  "line": 15,
  "column": 23,
  "severity": "error" | "warning",
  "message": "Parse error: unexpected token",
  "tool": "sparql_check"
}
```

### CI Job Status
- **pass**: All validation checks succeeded
- **fail**: One or more error-level findings detected
- **warn**: Only warning-level findings detected (treated as pass)

### Performance Metrics
- Job runtime tracked per validation component
- Cache hit rates for Node/Java dependencies
- Target: ≤ 5 min average, ≤ 7 min P95

## Error Handling

### Validation Failures
- **RIOT errors**: Fail immediately, report file/line/column
- **SPARQL parse errors**: Fail immediately, report token/offset
- **rdflint Fatal/Error**: Fail job, report all findings
- **Security findings**: Fail job, redact secrets in output

### Warnings
- **SPARQL formatting drift**: Log to output, do not fail
- **rdflint style issues**: Log to output, do not fail
- Toggle via `ENFORCE_SPQ_FORMAT=true` to promote formatting to error

### Infrastructure Failures
- **Tool download failures**: Fail job with clear error message
- **Cache failures**: Proceed without cache, log warning
- **GitHub API failures**: Fail job if unable to report status

### Timeout Handling
- Individual validation steps timeout after 10 minutes
- Overall job timeout: 15 minutes
- On timeout: Fail job with partial results

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Error-level findings fail the job
*For any* CI execution where RIOT, SPARQL parser, gitleaks, or pip-audit detects error-level findings, the CI job should exit with non-zero status.
**Validates: Requirements 4.1, 4.4, 6.1, 6.2**

### Property 2: Warning-level findings pass the job
*For any* CI execution where only warning-level findings exist (SPARQL formatting, rdflint style), the CI job should exit with zero status.
**Validates: Requirements 4.3, 4.5**

### Property 3: File coverage completeness
*For any* repository state, the CI pipeline should validate all `.ttl` files in ontology/shapes/mappings/build directories and all `.rq` files in queries directory.
**Validates: Requirements 3.1, 3.2**

### Property 4: Annotation completeness
*For any* validation finding (error or warning), the CI output should include file path, line number, and column number.
**Validates: Requirements 9.2**

### Property 5: Performance bounds
*For any* CI execution with typical file counts, the validation jobs should complete within 7 minutes (95th percentile).
**Validates: Requirements 2.1**

### Property 6: Tool licensing compliance
*For any* tool invoked by the CI pipeline, the tool should have an OSI-approved license or be organization-approved.
**Validates: Requirements 1.1, 1.2**

## Testing Strategy

### Unit Testing
- **SPARQL checker**: Test with valid/invalid/malformed `.rq` files
- **Validation scripts**: Test exit codes and output formats
- **Mock files**: Create minimal test fixtures for each file type

### Property-Based Testing
- **Property 1 (Error failures)**: Generate files with various error types, verify job fails
- **Property 2 (Warning passes)**: Generate files with only warnings, verify job passes
- **Property 3 (File coverage)**: Generate random file sets, verify all are validated
- **Property 4 (Annotation completeness)**: Generate findings, verify all have file/line/col
- **Property 5 (Performance)**: Run with various file counts, verify time bounds
- **Property 6 (Licensing)**: Audit all tools, verify OSI compliance

### Integration Testing
- **CI workflow**: Test with sample PRs containing known issues
- **End-to-end**: Verify annotations appear correctly on PRs
- **Performance**: Measure runtime with realistic file counts

### Test Scenarios (from Requirements)
1. Invalid `.ttl` → RIOT fails, annotation shows line/col
2. Unparsable `.rq` → SPARQL parse fails, annotation shows token
3. Committed secret → gitleaks fails, redacted in output
4. High CVE dependency → pip-audit fails
5. Formatting-only SPARQL drift → warnings only, job passes
6. Domain metrics regression → job fails

### Validation Criteria
- All error-level findings must fail the job
- All warnings must be visible but not fail the job
- Performance targets must be met (≤ 5 min avg, ≤ 7 min P95)
- All tools must be OSI-licensed or org-approved

## Configuration (optional, future)
- `.gitleaks.toml` for allowlist only when necessary
- `.rdflint.yml` for custom rules/vocabulary checks
- Minimal, reviewed ignore list for pip-audit

## Out of Scope
- Building SonarQube plugins
- Replacing SonarCloud
- IDE-specific plugins
