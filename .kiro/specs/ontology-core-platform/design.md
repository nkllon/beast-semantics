# Design Document: Ontology Core Platform

## Overview

The Ontology Core Platform provides shared standards, controls, and reusable assets for ontology platform capabilities. It establishes common patterns for versioning, validation, metadata, configuration, and observability that are consumed by both publishing and runtime query systems.

The platform is designed around immutable, versioned releases with comprehensive validation gates and reproducible builds. It provides a foundation for both static publishing (via Cloudflare) and runtime queries (via SPARQL/GraphQL gateways).

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Core Platform Standards                   │
├─────────────────────────────────────────────────────────────┤
│  Versioning  │  Validation  │  Metadata  │  Configuration   │
│   (SemVer)   │   (Gates)    │  (VoID)    │   (Env Vars)    │
└──────┬───────────────┬───────────────┬────────────────┬─────┘
       │               │               │                │
       ▼               ▼               ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Publishing  │ │   Runtime    │ │  Templates   │ │ Observability│
│   System     │ │   Queries    │ │  & Examples  │ │  Standards   │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

### Component Layers

1. **Versioning Layer**: SemVer-based artifact organization with immutable releases
2. **Validation Layer**: Multi-stage validation gates (RIOT, rdflint, SPARQL, SHACL)
3. **Metadata Layer**: Provenance tracking with VoID/DCAT, CITATION.cff, and manifests
4. **Configuration Layer**: Standardized environment variables for deployment
5. **Security Layer**: Cloudflare baseline controls (WAF, rate limits, TLS, Access)
6. **Observability Layer**: Structured logging, metrics, dashboards, and alerts

## Components and Interfaces

### 1. Release Management Component

**Responsibilities:**
- Generate versioned release directories following `/releases/Major.Minor.Patch/` structure
- Create and maintain `/latest` pointer to current release
- Generate cryptographic manifests (SHA-256, MD5)
- Ensure immutable artifact storage

**Key Interfaces:**
- `release_freeze.py`: Creates immutable release snapshots with checksums
- `verify-release.sh`: Validates release integrity against manifests

### 2. Validation Gates Component

**Responsibilities:**
- Enforce RDF syntax validation (RIOT)
- Enforce RDF quality checks (rdflint)
- Enforce SPARQL parse and format validation
- Enforce SHACL constraint validation
- Fail builds on validation errors

**Key Interfaces:**
- `validate.py`: SHACL validation using pyshacl
- `validate_rdf.py`: RDF syntax validation using RDFLib
- `sparql_check.mjs`: SPARQL parsing and formatting validation
- CI workflows: `.github/workflows/ci.yml`, `.github/workflows/qa.yml`

### 3. Build Component

**Responsibilities:**
- Assemble ontology modules and data into unified artifacts
- Ensure deterministic builds with canonical serialization
- Maintain clean working tree (no tracked file modifications)
- Generate build artifacts for PR review

**Key Interfaces:**
- `assemble.py`: Combines ontology modules and data into unified RDF graph
- Build output: `build/words-v1.ttl`

### 4. Metadata Component

**Responsibilities:**
- Generate VoID/DCAT dataset metadata
- Track provenance (git commit, timestamp)
- Include SHACL validation reports
- Provide CITATION.cff for academic citation

**Key Interfaces:**
- Metadata files in release directories
- SHACL reports: `build/shacl-report.txt`

### 5. Configuration Schema Component

**Responsibilities:**
- Define standard environment variables for all deployments
- Support flexible endpoint configuration
- Enable authentication mode selection
- Configure caching behavior

**Standard Environment Variables:**
- `SPARQL_ENDPOINT`: Query endpoint URL
- `SPARQL_UPDATE_ENDPOINT`: Update endpoint URL (optional)
- `DATASET_ID`: Dataset identifier
- `GATEWAY_URL`: Gateway service address
- `AUTH_MODE`: Authentication mode (none, token, mtls)
- `AUTH_TOKEN_HEADER`: Token header name
- `CACHE_TTL_S`: Cache time-to-live in seconds
- `CACHE_BYPASS_HEADER`: Cache bypass header name

### 6. Security Baseline Component

**Responsibilities:**
- Document Cloudflare WAF rule requirements
- Define rate limit policies
- Specify TLS requirements
- Configure Access policies for admin UIs
- Enable request logging and error analytics

**Controls:**
- WAF rules for common attack patterns
- Rate limits per IP/token
- TLS 1.2+ enforcement
- Cloudflare Access for admin paths
- Structured request/error logging

### 7. Observability Component

**Responsibilities:**
- Define required log fields (correlation ID, query ID, duration, row count)
- Specify dashboard metrics (p50/p95 latency, error rate, cache hit ratio)
- Set alert thresholds for performance regressions
- Enable performance budget tracking

**Standard Log Fields:**
- `correlation_id`: Request correlation identifier
- `query_id`: Query identifier
- `duration_ms`: Query duration in milliseconds
- `row_count`: Number of rows returned
- `user_id`: User identifier (when available)
- `session_id`: Session identifier (when available)

**Standard Metrics:**
- p50 latency
- p95 latency
- 5xx error rate
- Cache hit ratio

### 8. Templates Component

**Responsibilities:**
- Provide HyperGraphQL schema templates
- Provide GraphQL-LD context templates
- Provide cache key strategy examples
- Provide load test script examples

**Template Locations:**
- `tools/gateways/hypergraphql/`: HyperGraphQL config and schema
- `tools/gateways/graphql-ld/`: GraphQL-LD examples

## Data Models

### Release Artifact Structure

```
releases/
├── 1.0.0/
│   ├── AGENTS.md
│   ├── README.md
│   ├── CITATION.cff
│   ├── MANIFEST.sha256
│   ├── MANIFEST.md5 (optional)
│   ├── .cursor/commands/kiro/
│   ├── .kiro/settings/
│   ├── tools/
│   ├── ontology/
│   ├── shapes/
│   ├── queries/
│   └── metadata/
│       ├── void.ttl
│       └── shacl-report.txt
├── 1.0.1/
│   └── ...
└── latest -> 1.0.1/
```

### Configuration Schema

```yaml
# Environment variables for deployment
SPARQL_ENDPOINT: "http://localhost:3030/dataset/sparql"
SPARQL_UPDATE_ENDPOINT: "http://localhost:3030/dataset/update"
DATASET_ID: "words-ontology"
GATEWAY_URL: "https://api.example.com/graphql"
AUTH_MODE: "token"
AUTH_TOKEN_HEADER: "X-Auth-Token"
CACHE_TTL_S: "3600"
CACHE_BYPASS_HEADER: "X-Cache-Bypass"
```

### Manifest Format

```
# MANIFEST.sha256
<sha256-hash>  <relative-path>
<sha256-hash>  <relative-path>
...
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: SemVer format compliance
*For any* version string used by the Core Platform, it should match the Semantic Versioning format Major.Minor.Patch where each component is a non-negative integer
**Validates: Requirements 1.1**

### Property 2: Release path structure consistency
*For any* release version, the artifact directory path should follow the pattern `/releases/Major.Minor.Patch/` exactly
**Validates: Requirements 1.2**

### Property 3: Release metadata completeness
*For any* release directory, it should contain all required metadata files: VoID or DCAT metadata, git commit hash, timestamp, SHACL validation report, and CITATION.cff
**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

### Property 4: Configuration schema completeness
*For any* configuration parser, it should recognize and validate all required environment variables: SPARQL_ENDPOINT, SPARQL_UPDATE_ENDPOINT, DATASET_ID, GATEWAY_URL, AUTH_MODE, AUTH_TOKEN_HEADER, CACHE_TTL_S, CACHE_BYPASS_HEADER
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8**

### Property 5: Log field completeness
*For any* structured log entry, it should contain all required fields: correlation_id, query_id, duration_ms, row_count, and optionally user_id and session_id when available
**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

### Property 6: Build determinism
*For any* source state, building twice should produce byte-identical artifacts (same content hashes)
**Validates: Requirements 11.1, 11.2, 11.3, 12.1, 12.2, 12.3, 12.4**

### Property 7: Clean working tree preservation
*For any* build execution, the git working tree should have no modifications to tracked files after the build completes
**Validates: Requirements 13.1, 13.2, 13.3, 13.4**

### Property 8: Output policy enforcement
*For any* release build, it should enforce presence of VoID/DCAT metadata and SHACL validation reports, and fail if configured size or row-count budgets are exceeded
**Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.5**

### Property 9: Manifest integrity
*For any* release with a manifest file, recomputing checksums for all artifacts should match the checksums in the manifest
**Validates: Requirements 16.1, 16.2, 16.3**

### Property 10: Release workflow automation
*For any* git tag creation, the system should automatically build artifacts, validate them, generate metadata, and publish them
**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

## Error Handling

### Validation Failures

**RIOT Syntax Errors:**
- Fail CI build immediately
- Report file, line, and error message
- Provide remediation guidance

**SHACL Validation Violations:**
- Fail CI build on any violation
- Generate detailed validation report
- Include violation details in build output

**SPARQL Parse Errors:**
- Fail CI build on parse failures
- Report file, line, column, and error
- Warn on formatting issues (configurable to error)

**Manifest Mismatch:**
- Fail verify-release job
- Report which files have mismatched checksums
- Prevent publication of unverified releases

### Build Failures

**Non-Deterministic Builds:**
- Fail CI if double-build produces different hashes
- Report which files differ
- Investigate serialization or timestamp issues

**Dirty Working Tree:**
- Fail CI if tracked files are modified
- Report which files changed
- Ensure .gitignore covers all derived artifacts

**Policy Violations:**
- Fail CI with concise summary
- Report which policies failed (size, row count, metadata presence)
- Provide threshold values and actual values

### Configuration Errors

**Missing Required Variables:**
- Fail at startup with clear error message
- List all missing required variables
- Provide example configuration

**Invalid Variable Values:**
- Fail at startup with validation error
- Specify expected format/range
- Provide corrected example

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

**Release Management:**
- Test SemVer parsing with valid and invalid versions
- Test release directory creation
- Test manifest generation with known files
- Test /latest pointer creation and updates

**Validation:**
- Test SHACL validation with known valid/invalid RDF
- Test SPARQL parsing with known valid/invalid queries
- Test RDF syntax validation with various formats

**Build:**
- Test assembly of known ontology modules
- Test clean working tree detection
- Test artifact generation

**Configuration:**
- Test environment variable parsing
- Test missing variable detection
- Test invalid value handling

### Property-Based Testing

Property-based tests will verify universal properties across random inputs using **Hypothesis** (Python) and **fast-check** (JavaScript/Node.js):

**Configuration:**
- Minimum 100 iterations per property test
- Use Hypothesis for Python components
- Use fast-check for JavaScript/Node.js components

**Property Tests:**
- Each correctness property will have a corresponding property-based test
- Tests will generate random valid inputs and verify properties hold
- Tests will generate random invalid inputs and verify proper error handling
- Edge cases (empty inputs, boundary values, special characters) will be covered by generators

**Test Organization:**
- Property tests co-located with source files using `.test.py` or `.test.mjs` suffix
- Each test annotated with: `**Feature: ontology-core-platform, Property N: <property text>**`
- Each test references requirements: `**Validates: Requirements X.Y**`

### Integration Testing

Integration tests will verify end-to-end workflows:

**Release Workflow:**
- Create tag → build → validate → publish → verify
- Test with sample ontology data
- Verify all artifacts present and valid

**Validation Pipeline:**
- Run full validation suite on sample data
- Verify all gates execute correctly
- Test failure propagation

### Performance Testing

Performance tests will verify budgets and limits:

**Build Performance:**
- Measure build time for various dataset sizes
- Verify builds complete within reasonable time
- Test with large ontologies

**Validation Performance:**
- Measure validation time for various dataset sizes
- Verify p95 latency meets 250ms budget (where applicable)
- Test with complex SHACL shapes

## Implementation Notes

### Technology Stack

**Python Components:**
- Python 3.11+
- RDFLib for RDF parsing and manipulation
- pyshacl for SHACL validation
- Hypothesis for property-based testing

**JavaScript/Node.js Components:**
- Node.js 20+
- sparqljs for SPARQL parsing
- sparql-formatter for SPARQL formatting
- fast-check for property-based testing

**CI/CD:**
- GitHub Actions
- Ubuntu latest runners
- Pinned action versions for reproducibility

### Build Process

1. **Assembly**: Combine ontology modules and data files into unified graph
2. **Validation**: Run all validation gates (RIOT, rdflint, SPARQL, SHACL)
3. **Artifact Generation**: Serialize to multiple formats (Turtle, JSON-LD, HTML)
4. **Metadata Generation**: Create VoID/DCAT, provenance, CITATION.cff
5. **Manifest Creation**: Compute checksums for all artifacts
6. **Publication**: Upload to storage (R2, S3, etc.) with immutable keys

### Deployment Patterns

**Publishing Deployment:**
- Static artifacts served via Cloudflare CDN
- Content negotiation via Workers
- Immutable versioned URLs
- Long cache TTLs

**Runtime Deployment:**
- SPARQL endpoint (Fuseki or GraphDB)
- GraphQL gateway (HyperGraphQL or GraphQL-LD)
- Cloudflare Access for authentication
- WAF and rate limiting at edge
- Persisted query caching

### Observability Implementation

**Structured Logging:**
- JSON format for machine parsing
- Required fields in every log entry
- Correlation IDs for request tracing
- Query IDs for debugging

**Metrics Collection:**
- Prometheus-compatible metrics
- Grafana dashboards
- Alert rules in code
- Performance budget tracking

**Dashboards:**
- Latency percentiles (p50, p95, p99)
- Error rates by type
- Cache hit ratios
- Request volume

## Security Considerations

### Cloudflare Baseline

**WAF Rules:**
- OWASP Core Rule Set
- Custom rules for RDF/SPARQL patterns
- Rate limiting per IP and token
- DDoS protection

**Access Control:**
- Public read access for published ontologies
- Cloudflare Access for admin UIs
- SSO integration for runtime queries
- Token-based authentication for APIs

**TLS:**
- TLS 1.2+ enforcement
- Strong cipher suites
- HSTS headers
- Certificate pinning (optional)

### Secrets Management

**No Hardcoded Secrets:**
- All credentials via environment variables
- Runtime injection only
- No secrets in version control
- Gitleaks scanning in CI

**Token Handling:**
- Configurable token header names
- Token validation at edge
- Token rotation support
- Audit logging for token usage

## Performance Considerations

### Performance Budgets

**Baseline Targets:**
- p95 latency: 250ms at low request rate
- Build time: < 5 minutes for typical ontology
- Validation time: < 2 minutes for typical ontology
- Cache hit ratio: > 80% for persisted queries

**Scalability:**
- Horizontal scaling for runtime queries
- CDN edge caching for published artifacts
- Connection pooling for SPARQL endpoints
- Query result pagination

### Optimization Strategies

**Build Optimization:**
- Incremental builds where possible
- Parallel validation steps
- Cached dependencies
- Deterministic serialization

**Query Optimization:**
- Persisted queries for common patterns
- Edge caching with appropriate TTLs
- Query complexity limits
- Result set pagination

## Maintenance and Operations

### Release Process

1. **Tag Creation**: Create SemVer git tag
2. **CI Trigger**: GitHub Actions workflow starts
3. **Build**: Assemble artifacts
4. **Validate**: Run all validation gates
5. **Freeze**: Create immutable release snapshot with manifest
6. **Verify**: Rebuild and compare checksums
7. **Publish**: Upload to storage
8. **Update**: Update /latest pointer
9. **Notify**: Trigger cache invalidation

### Monitoring

**Key Metrics:**
- Build success rate
- Validation failure rate
- Release frequency
- Artifact sizes
- Query latency
- Error rates

**Alerts:**
- Build failures
- Validation failures
- Performance regressions
- Security scan findings
- Resource saturation

### Runbooks

**Common Operations:**
- Creating a new release
- Rolling back a release
- Investigating validation failures
- Debugging performance issues
- Updating Cloudflare configuration
- Rotating credentials

## Future Enhancements

### Phase 2 Features

**SBOM Generation:**
- CycloneDX format
- Dependency tracking
- Vulnerability scanning
- License compliance

**Enhanced Caching:**
- Intelligent cache warming
- Predictive prefetching
- Multi-tier caching
- Cache analytics

**Advanced Observability:**
- Distributed tracing
- Query plan analysis
- Cost attribution
- Capacity planning

### Extensibility

**Plugin System:**
- Custom validation rules
- Additional serialization formats
- Custom metadata generators
- Integration hooks

**Multi-Cloud Support:**
- AWS S3 + CloudFront
- Azure Blob + CDN
- GCP Storage + CDN
- Vendor-agnostic abstractions
