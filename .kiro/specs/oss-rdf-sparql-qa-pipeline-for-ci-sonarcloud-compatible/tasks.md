# Implementation Plan

- [x] 1. Implement SPARQL validation component
  - Create `tools/sparql_check.mjs` that uses sparqljs to parse SPARQL queries
  - Implement error detection for parse failures with file, line, and column reporting
  - Implement format checking using sparql-formatter with warning-level output
  - Support environment variable `ENFORCE_SPQ_FORMAT` to elevate formatting to errors
  - Return exit code 1 for parse errors, 0 for warnings or success
  - _Requirements: 3.2, 4.4, 4.5, 9.2_

- [x] 2. Implement RDF validation workflow
- [x] 2.1 Add RDFLib validation step
  - Create `tools/validate_rdf.py` using RDFLib to validate RDF files
  - Process files in ontology, shapes, mappings, and build directories
  - Support TTL/TriG/N-Triples/N-Quads formats
  - Ensure validation failures report file and error information
  - Configure job to fail on any validation error
  - _Requirements: 3.1, 4.1, 9.2_
  - **Note**: Implementation uses RDFLib instead of Apache Jena RIOT (simpler, Python-based)

- [ ] 2.2 Add rdflint validation step (deferred)
  - Download rdflint fat JAR in CI workflow
  - Execute rdflint with default configuration across RDF directories
  - Configure job to fail on Fatal or Error level findings
  - Allow style-level findings to pass as warnings
  - _Requirements: 3.1, 4.2, 4.3_
  - **Status**: Not implemented in current workflow; RDFLib provides core validation

- [x] 3. Implement security scanning gates
- [x] 3.1 Add secrets scanning with gitleaks
  - Integrate gitleaks/gitleaks-action@v2 into CI workflow
  - Configure with --redact flag to prevent secret exposure in logs
  - Set job to fail when secrets are detected
  - _Requirements: 6.1_

- [x] 3.2 Add Python dependency scanning with pip-audit
  - Add pip-audit execution step in CI workflow
  - Run pip-audit against requirements.txt with JSON output
  - Configure to fail on vulnerabilities with CVSS >= 7.0 (High/Critical)
  - _Requirements: 6.2_

- [x] 4. Configure CI workflow infrastructure
- [x] 4.1 Set up runtime environments
  - Add actions/setup-node step with Node 20 and npm caching enabled
  - Add actions/setup-python step with Python 3.x
  - Pin all action versions for reproducibility
  - _Requirements: 1.1, 2.2, 8.1_
  - **Note**: Java/Jena not used; Python RDFLib used instead

- [x] 4.2 Wire SPARQL validation into CI
  - Install sparqljs and sparql-formatter via npm
  - Add workflow step to execute tools/sparql_check.mjs on queries directory
  - Configure to fail job on parse errors, warn on formatting issues
  - _Requirements: 2.1, 3.2, 4.4, 4.5_

- [x] 4.3 Configure Node tools with reproducibility flags
  - Add --no-fund and --no-audit flags to all npm install commands
  - Verify no external secrets required beyond GITHUB_TOKEN
  - _Requirements: 8.2, 8.3_

- [x] 4.4 Add CI job summary output
  - Implement concise pass/fail summary at end of CI workflow
  - Ensure all validation steps report clear status
  - _Requirements: 9.1_

- [x] 5. Add domain metrics validation
  - Integrate metrics_diversity.py execution into CI workflow
  - Configure to compare results against main branch baseline
  - Set job to fail on regression unless threshold explicitly adjusted
  - _Requirements: 7.1_

- [x] 6. Add optional SPARQL formatting enforcement
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
  - Include examples of RDFLib, SPARQL, gitleaks, and pip-audit errors
  - _Requirements: 9.1, 9.2_

- [x] 9. Create local CI runner script
  - Create `tools/ci_local.sh` that mirrors GitHub workflow
  - Support local execution with Python venv
  - Include all validation steps from CI workflow
  - _Requirements: 8.1, 8.2_

- [x] 10. Create helper scripts
  - Create `tools/install_gitleaks.sh` for local gitleaks installation
  - Create `tools/fetch_jena.sh` for Apache Jena download (optional, not used in current workflow)
  - _Requirements: 2.2_

- [ ]* 11. Property-based testing
  - [ ]* 11.1 Write property test for error-level failures
    - **Property 1: Error-level findings fail the job**
    - **Validates: Requirements 4.1, 4.4, 6.1, 6.2**

  - [ ]* 11.2 Write property test for warning-level passes
    - **Property 2: Warning-level findings pass the job**
    - **Validates: Requirements 4.3, 4.5**

  - [ ]* 11.3 Write property test for file coverage
    - **Property 3: File coverage completeness**
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 11.4 Write property test for annotation completeness
    - **Property 4: Annotation completeness**
    - **Validates: Requirements 9.2**

  - [ ]* 11.5 Write property test for performance bounds
    - **Property 5: Performance bounds**
    - **Validates: Requirements 2.1**

  - [ ]* 11.6 Write property test for tool licensing
    - **Property 6: Tool licensing compliance**
    - **Validates: Requirements 1.1, 1.2**

  - [ ]* 11.7 Run all property-based tests
    - Execute all property tests with 100+ iterations
    - Verify all properties hold across random inputs
    - Fix any discovered edge cases

- [ ] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
