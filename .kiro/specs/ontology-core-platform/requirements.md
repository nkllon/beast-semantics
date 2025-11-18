# Requirements Document

## Introduction
This specification defines shared standards, controls, and reusable assets for ontology platform capabilities. The platform provides common versioning, validation, metadata, configuration, and observability patterns consumed by both publishing and runtime query specifications.

## Glossary

- **Core Platform**: The shared standards, controls, and templates used by ontology publishing and runtime query systems
- **SemVer**: Semantic Versioning scheme using Major.Minor.Patch format
- **Validation Gates**: Automated quality checks enforced in CI including RIOT, rdflint, SPARQL parsing, and SHACL validation
- **VoID**: Vocabulary of Interlinked Datasets, an RDF vocabulary for describing datasets
- **DCAT**: Data Catalog Vocabulary, a W3C standard for describing datasets
- **Cloudflare Baseline**: Standard Cloudflare configuration including WAF, rate limits, TLS, and Access policies

## Requirements

### Requirement 1: Versioning and Artifact Layout

**User Story:** As a maintainer, I want semantic versioning with deterministic artifact paths, so that releases are immutable and discoverable.

#### Acceptance Criteria

1. THE Core Platform SHALL use Semantic Versioning format Major.Minor.Patch.
2. THE Core Platform SHALL store artifacts in /releases/Major.Minor.Patch/ directory structure.
3. THE Core Platform SHALL provide /latest pointer to current release.
4. WHERE feasible, THE Core Platform SHALL use deterministic and content-addressable filenames.

### Requirement 2: Validation Gates

**User Story:** As a quality engineer, I want automated validation in CI, so that invalid RDF and SPARQL are rejected before merge.

#### Acceptance Criteria

1. THE Core Platform SHALL enforce RIOT syntax validation in CI.
2. THE Core Platform SHALL enforce rdflint policy checks in CI.
3. THE Core Platform SHALL enforce SPARQL parse and format checks in CI.
4. THE Core Platform SHALL enforce SHACL validation in CI.
5. WHEN SHACL validation detects violations, THE Core Platform SHALL fail the CI build.

### Requirement 3: Release Metadata

**User Story:** As a data consumer, I want comprehensive metadata with each release, so that I can understand provenance and validate datasets.

#### Acceptance Criteria

1. THE Core Platform SHALL include VoID or DCAT metadata in each release.
2. THE Core Platform SHALL include git commit hash in release provenance.
3. THE Core Platform SHALL include timestamp in release provenance.
4. THE Core Platform SHALL include SHACL validation reports in each release.
5. THE Core Platform SHALL include CITATION.cff file in each release.

### Requirement 4: Configuration Schema

**User Story:** As a developer, I want standardized configuration variables, so that deployment configuration is consistent across environments.

#### Acceptance Criteria

1. THE Core Platform SHALL define SPARQL_ENDPOINT environment variable for query endpoints.
2. THE Core Platform SHALL define SPARQL_UPDATE_ENDPOINT environment variable for update endpoints.
3. THE Core Platform SHALL define DATASET_ID environment variable for dataset identification.
4. THE Core Platform SHALL define GATEWAY_URL environment variable for gateway addresses.
5. THE Core Platform SHALL define AUTH_MODE environment variable for authentication mode selection.
6. THE Core Platform SHALL define AUTH_TOKEN_HEADER environment variable for token header name.
7. THE Core Platform SHALL define CACHE_TTL_S environment variable for cache time-to-live in seconds.
8. THE Core Platform SHALL define CACHE_BYPASS_HEADER environment variable for cache bypass header name.

### Requirement 5: Cloudflare Baseline Controls

**User Story:** As a security engineer, I want standard Cloudflare security controls documented, so that both publishing and runtime deployments are protected consistently.

#### Acceptance Criteria

1. THE Core Platform SHALL document WAF rule requirements.
2. THE Core Platform SHALL document rate limit requirements.
3. THE Core Platform SHALL document TLS requirements.
4. THE Core Platform SHALL document Access policy requirements for admin UIs.
5. THE Core Platform SHALL document request logging requirements.
6. THE Core Platform SHALL document error analytics requirements.

### Requirement 6: Limits and Safety Defaults

**User Story:** As an operator, I want documented safety limits, so that services are protected from resource exhaustion.

#### Acceptance Criteria

1. THE Core Platform SHALL document server timeout defaults.
2. THE Core Platform SHALL document maximum results per page defaults.
3. THE Core Platform SHALL document GraphQL depth limit defaults.
4. THE Core Platform SHALL document GraphQL complexity limit defaults.
5. THE Core Platform SHALL document request size limit defaults.

### Requirement 7: Observability Standards

**User Story:** As an SRE, I want standardized logging and monitoring, so that I can troubleshoot issues and track performance across deployments.

#### Acceptance Criteria

1. THE Core Platform SHALL define required log field: correlation ID.
2. THE Core Platform SHALL define required log field: query ID.
3. THE Core Platform SHALL define required log field: duration.
4. THE Core Platform SHALL define required log field: row count.
5. WHERE user or session identification is available, THE Core Platform SHALL define required log fields for user ID and session ID.
6. THE Core Platform SHALL define dashboard metric: p50 latency.
7. THE Core Platform SHALL define dashboard metric: p95 latency.
8. THE Core Platform SHALL define dashboard metric: 5xx error rate.
9. THE Core Platform SHALL define dashboard metric: cache hit ratio.
10. THE Core Platform SHALL define alert thresholds for performance regressions.

### Requirement 8: Performance Budgets

**User Story:** As a performance engineer, I want baseline performance budgets, so that regressions are detected and addressed.

#### Acceptance Criteria

1. THE Core Platform SHALL define baseline p95 latency budget of 250 milliseconds at low request rate.
2. THE Core Platform SHALL document performance measurement procedures.
3. THE Core Platform SHALL document performance budget exception process.
4. THE Core Platform SHALL support configurable performance budgets per deployment.

### Requirement 9: Release Workflow

**User Story:** As a release engineer, I want automated release workflows, so that artifacts are built, validated, and published consistently.

#### Acceptance Criteria

1. WHEN a git tag is created, THE Core Platform SHALL build artifacts.
2. WHEN a git tag is created, THE Core Platform SHALL validate artifacts.
3. WHEN a git tag is created, THE Core Platform SHALL generate metadata.
4. WHEN a git tag is created, THE Core Platform SHALL publish artifacts.
5. THE Core Platform SHALL ingest runtime datasets from immutable published artifacts.

### Requirement 10: Reusable Templates

**User Story:** As a developer, I want reusable templates for common patterns, so that I can quickly set up new projects with best practices.

#### Acceptance Criteria

1. THE Core Platform SHALL provide HyperGraphQL schema template.
2. THE Core Platform SHALL provide GraphQL-LD context template.
3. THE Core Platform SHALL provide cache key strategy template.
4. THE Core Platform SHALL provide load test script examples.



### Requirement 11: Reproducible Build

**User Story:** As a release engineer, I want reproducible builds with verification, so that I can ensure release artifacts match their source and detect tampering.

#### Acceptance Criteria

1. WHEN a release tag is created, THE Core Platform SHALL support a rebuild-and-verify flow in CI.
2. WHEN the verify-release job runs, THE Core Platform SHALL rebuild artifacts and compare against the frozen release manifest.
3. WHEN hash mismatches are detected, THE Core Platform SHALL fail the verify-release job.

### Requirement 12: Build Determinism

**User Story:** As a quality engineer, I want deterministic builds, so that identical source produces identical artifacts.

#### Acceptance Criteria

1. THE Core Platform SHALL canonicalize build outputs with sorted triples and prefixes.
2. THE Core Platform SHALL use deterministic blank node handling in build outputs.
3. THE Core Platform SHALL pin serializer versions in build outputs.
4. WHERE feasible, THE Core Platform SHALL run a double-build in CI and compare hashes to detect nondeterminism.

### Requirement 13: Clean Working Tree

**User Story:** As a maintainer, I want clean working trees after builds, so that derived artifacts do not pollute version control.

#### Acceptance Criteria

1. WHEN CI builds complete, THE Core Platform SHALL fail if the build modifies tracked files.
2. WHEN CI builds complete, THE Core Platform SHALL fail if the build creates tracked files.
3. THE Core Platform SHALL exclude derived artifacts via .gitignore.
4. THE Core Platform SHALL keep derived artifacts untracked in version control.

### Requirement 14: Pull Request Artifacts

**User Story:** As a reviewer, I want to inspect derived artifacts in pull requests, so that I can verify changes without committing artifacts.

#### Acceptance Criteria

1. WHEN a pull request is created, THE Core Platform SHALL rebuild derived artifacts in CI.
2. WHEN a pull request is created, THE Core Platform SHALL upload derived artifacts as CI artifacts.
3. THE Core Platform SHALL NOT commit derived artifacts in pull requests.

### Requirement 15: Output Policy Enforcement

**User Story:** As a quality engineer, I want enforced output policies, so that releases meet quality and size requirements.

#### Acceptance Criteria

1. WHEN CI builds complete, THE Core Platform SHALL enforce presence of VoID or DCAT metadata.
2. WHEN CI builds complete, THE Core Platform SHALL enforce presence of SHACL validation reports.
3. WHERE configured, THE Core Platform SHALL enforce size budget thresholds on outputs.
4. WHERE configured, THE Core Platform SHALL enforce row-count budget thresholds on outputs.
5. WHEN policy violations are detected, THE Core Platform SHALL fail CI with a concise summary.

### Requirement 16: Release Integrity Manifests

**User Story:** As a security engineer, I want cryptographic manifests for releases, so that I can verify artifact integrity.

#### Acceptance Criteria

1. THE Core Platform SHALL include MANIFEST.sha256 file containing SHA-256 checksums in each release.
2. WHERE feasible, THE Core Platform SHALL include MANIFEST.md5 file containing MD5 checksums in each release.
3. WHEN verify-release task runs, THE Core Platform SHALL validate checksums against manifest files.

### Requirement 17: Publication Safety

**User Story:** As a release engineer, I want safe publication controls, so that only verified releases are published.

#### Acceptance Criteria

1. WHEN publishing releases, THE Core Platform SHALL publish only signed builds.
2. WHEN publishing releases, THE Core Platform SHALL publish only tagged builds.
3. WHEN publishing releases, THE Core Platform SHALL publish only builds that passed verification.
4. THE Core Platform SHALL NOT publish artifacts from pull requests.

### Requirement 18: CI Job Summary

**User Story:** As a developer, I want human-friendly CI summaries, so that I can quickly understand build results.

#### Acceptance Criteria

1. WHEN CI builds complete, THE Core Platform SHALL emit a summary including artifact list.
2. WHEN CI builds complete, THE Core Platform SHALL emit a summary including artifact sizes.
3. WHEN CI builds complete, THE Core Platform SHALL emit a summary including SHACL validation status.
4. WHERE configured, THE Core Platform SHALL emit a summary including policy budget metrics.

## Acceptance

- Both child specs reference this document for versioning, validation gates, config schema, and Cloudflare baseline controls.
- A minimal sample project can consume the shared templates to produce a passing build without additional policy wiring.
- Dashboards and alerts are uniformly defined and reusable across publishing and runtime deployments.
