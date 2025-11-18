# Implementation Plan

- [ ] 1. Implement SPARQL validation component
  - Create `tools/sparql_check.mjs` that uses sparqljs to parse SPARQL queries
  - Implement error detection for parse failures with file, line, and column reporting
  - Implement format checking using sparql-formatter with warning-level output
  - Support environment variable `ENFORCE_SPQ_FORMAT` to elevate formatting to errors
  - Return exit code 1 for parse errors, 0 for warnings or success
  - _Requirements: 3.2, 4.4, 4.5, 9.2_

- [ ] 2. Implement RDF validation workflow
- [ ] 2.1 Add Apache Jena RIOT validation step
  - Download and install Apache Jena RIOT in CI workflow
  - Create validation script that runs `riot --validate` on each TTL/TriG/N-Triples/N-Quads file
  - Process files in ontology, shapes, mappings, and build directories
  - Ensure validation failures report file, line, and column information
  - Configure job to fail on any RIOT validation error
  - _Requirements: 3.1, 4.1, 9.2_

- [ ] 2.2 Add rdflint validation step
  - Download rdflint fat JAR in CI workflow
  - Execute rdflint with default configuration across RDF directories
  - Configure job to fail on Fatal or Error level findings
  - Allow style-level findings to pass as warnings
  - _Requirements: 3.1, 4.2, 4.3_

- [ ] 3. Implement security scanning gates
- [ ] 3.1 Add secrets scanning with gitleaks
  - Integrate gitleaks/gitleaks-action@v2 into CI workflow
  - Configure with --redact flag to prevent secret exposure in logs
  - Set job to fail when secrets are detected
  - _Requirements: 6.1_

- [ ] 3.2 Add Python dependency scanning with pip-audit
  - Add pip-audit execution step in CI workflow
  - Run pip-audit --strict against requirements.txt
  - Configure to fail on vulnerabilities with CVSS >= 7.0 (High/Critical)
  - _Requirements: 6.2_

- [ ] 4. Configure CI workflow infrastructure
- [ ] 4.1 Set up runtime environments
  - Add actions/setup-java step with Temurin 21
  - Add actions/setup-node step with Node 20 and npm caching enabled
  - Pin all action versions for reproducibility
  - _Requirements: 1.1, 2.2, 8.1_

- [ ] 4.2 Wire SPARQL validation into CI
  - Install sparqljs and sparql-formatter globally via npm
  - Add workflow step to execute tools/sparql_check.mjs on queries directory
  - Configure to fail job on parse errors, warn on formatting issues
  - _Requirements: 2.1, 3.2, 4.4, 4.5_

- [ ] 4.3 Configure Node tools with reproducibility flags
  - Add --no-fund and --no-audit flags to all npm install commands
  - Verify no external secrets required beyond GITHUB_TOKEN
  - _Requirements: 8.2, 8.3_

- [ ] 4.4 Add CI job summary output
  - Implement concise pass/fail summary at end of CI workflow
  - Ensure all validation steps report clear status
  - _Requirements: 9.1_

- [ ] 5. Add domain metrics validation
  - Integrate metrics_diversity.py execution into CI workflow
  - Configure to compare results against main branch baseline
  - Set job to fail on regression unless threshold explicitly adjusted
  - _Requirements: 7.1_

- [ ] 6. Add optional SPARQL formatting enforcement
  - Document ENFORCE_SPQ_FORMAT environment variable in workflow
  - Add commented example showing how to enable strict formatting
  - _Requirements: 4.5_

- [ ] 7. Prepare for Phase 2 SBOM scanning
  - Document CycloneDX SBOM generation approach
  - Document Trivy or Grype integration options
  - Note that Critical findings will require policy approval before enforcement
  - _Requirements: 6.3_

- [ ] 8. Document CI gates and remediation
  - Update README with section describing all validation gates
  - Document failure conditions for each gate
  - Provide remediation steps for common validation failures
  - Include examples of RIOT, rdflint, SPARQL, gitleaks, and pip-audit errors
  - _Requirements: 9.1, 9.2_
