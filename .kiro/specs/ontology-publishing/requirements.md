# Requirements Document

## Introduction
This specification defines static, versioned ontology publishing with stable URIs and content negotiation served via Cloudflare. The system publishes immutable artifacts without requiring runtime servers for public consumption. This specification adopts shared policies from ontology-core-platform for versioning, validation gates, metadata, Cloudflare baseline, configuration schema, limits, observability, performance budgets, and release workflow.

## Glossary

- **Publishing System**: The Cloudflare-based infrastructure (R2 storage, Workers, CDN) that serves ontology artifacts
- **Content Negotiation**: HTTP mechanism for serving different representations based on Accept headers
- **Turtle**: text/turtle RDF serialization format
- **JSON-LD**: application/ld+json RDF serialization format
- **pyLODE**: Python tool for generating HTML documentation from ontologies
- **Immutable Artifact**: A published file with a content-addressable or versioned path that is never modified

## Requirements

### Requirement 1: Stable URI Resolution

**User Story:** As an ontology consumer, I want stable URIs with content negotiation, so that I can access ontology terms in my preferred format.

#### Acceptance Criteria

1. WHEN a canonical IRI is requested with Accept header text/turtle, THE Publishing System SHALL return Turtle representation.
2. WHEN a canonical IRI is requested with Accept header application/ld+json, THE Publishing System SHALL return JSON-LD representation.
3. WHEN a canonical IRI is requested with Accept header text/html, THE Publishing System SHALL return HTML representation.

### Requirement 2: Immutable Versioning

**User Story:** As a data engineer, I want immutable versioned releases, so that I can depend on stable artifact URLs.

#### Acceptance Criteria

1. THE Publishing System SHALL support versioned paths in format /vMajor.Minor.Patch/.
2. THE Publishing System SHALL provide /latest pointer to current release.
3. THE Publishing System SHALL treat versioned releases as immutable.

### Requirement 3: Multiple Format Support

**User Story:** As a developer, I want ontologies published in multiple formats, so that I can use the format best suited for my tools.

#### Acceptance Criteria

1. THE Publishing System SHALL publish Turtle format files.
2. THE Publishing System SHALL publish JSON-LD format files.
3. THE Publishing System SHALL publish pyLODE-generated HTML documentation.
4. THE Publishing System SHALL include JSON-LD contexts for key vocabularies.

### Requirement 4: Dataset Metadata

**User Story:** As a data cataloger, I want dataset metadata published with each release, so that I can discover and understand ontology contents.

#### Acceptance Criteria

1. THE Publishing System SHALL publish VoID or DCAT metadata describing datasets.
2. THE Publishing System SHALL include release timestamp in provenance metadata.
3. THE Publishing System SHALL include git commit hash in provenance metadata.

### Requirement 5: Validation Reporting

**User Story:** As a quality engineer, I want SHACL validation reports published, so that I can verify ontology quality.

#### Acceptance Criteria

1. THE Publishing System SHALL include SHACL validation reports in each release.
2. WHEN SHACL validation detects errors, THE Publishing System SHALL fail CI build.

### Requirement 6: Automated Release Pipeline

**User Story:** As a release engineer, I want automated artifact building and publishing, so that releases are consistent and reproducible.

#### Acceptance Criteria

1. WHEN a git tag is created, THE Publishing System SHALL build artifacts.
2. WHEN a git tag is created, THE Publishing System SHALL push artifacts to Cloudflare R2.
3. WHEN a git tag is created, THE Publishing System SHALL update /latest pointer.
4. WHEN /latest pointer is updated, THE Publishing System SHALL invalidate CDN cache.

### Requirement 7: Edge Performance

**User Story:** As an end user, I want fast ontology access with efficient compression, so that downloads are quick.

#### Acceptance Criteria

1. THE Publishing System SHALL perform content negotiation via Cloudflare Worker.
2. THE Publishing System SHALL set Cache-Control headers with long time-to-live values.
3. THE Publishing System SHALL support gzip compression.
4. THE Publishing System SHALL support brotli compression.

### Requirement 8: Storage Durability

**User Story:** As a maintainer, I want immutable storage with no overwrites, so that published versions remain stable.

#### Acceptance Criteria

1. THE Publishing System SHALL store artifacts with immutable keys.
2. THE Publishing System SHALL prevent overwrites of versioned paths.

### Requirement 9: Discoverability

**User Story:** As a researcher, I want citation metadata and optional DOIs, so that I can properly cite ontologies.

#### Acceptance Criteria

1. THE Publishing System SHALL include CITATION.cff file in each release.
2. WHERE DOI registration is used, THE Publishing System SHALL support Zenodo DOI registration per release.

### Requirement 10: Access Control

**User Story:** As a security engineer, I want public read access with protected admin paths, so that ontologies are openly accessible while administration is secured.

#### Acceptance Criteria

1. THE Publishing System SHALL allow public GET requests without authentication.
2. THE Publishing System SHALL protect admin paths via Cloudflare Access.


