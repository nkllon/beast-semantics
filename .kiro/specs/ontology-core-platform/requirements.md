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


