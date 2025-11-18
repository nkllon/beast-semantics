# Requirements Document

## Introduction
This specification defines GraphQL gateway implementations over SPARQL endpoints using HyperGraphQL and GraphQL-LD with Comunica. The system provides read access to RDF datasets via GraphQL APIs without replacing existing SPARQL workflows.

## Glossary

- **Gateway System**: The collection of GraphQL-to-SPARQL translation services including HyperGraphQL and GraphQL-LD
- **HyperGraphQL**: A Java-based, configuration-driven GraphQL to SPARQL gateway
- **GraphQL-LD**: A Node.js-based GraphQL gateway using JSON-LD contexts with Comunica query engine
- **SPARQL Endpoint**: A standards-compliant SPARQL 1.1 query service (GraphDB or Fuseki)
- **Example Schema**: A minimal GraphQL schema demonstrating entity lookup, pagination, and property traversal

## Requirements

### Requirement 1: SPARQL Endpoint Connectivity

**User Story:** As a developer, I want to connect GraphQL gateways to any SPARQL 1.1 endpoint, so that I can use standard RDF stores without vendor lock-in.

#### Acceptance Criteria

1. THE Gateway System SHALL connect to SPARQL 1.1 compliant endpoints via SPARQL_ENDPOINT environment variable.
2. THE Gateway System SHALL support GraphDB endpoints.
3. THE Gateway System SHALL support Apache Jena Fuseki endpoints.

### Requirement 2: Local Development Environment

**User Story:** As a developer, I want to run gateways locally on macOS, so that I can develop and test without external dependencies.

#### Acceptance Criteria

1. WHERE HyperGraphQL is used, THE Gateway System SHALL run via Docker Desktop with Apple Silicon support.
2. WHERE GraphQL-LD is used, THE Gateway System SHALL run via Node.js version 18 or higher.

### Requirement 3: Open Source and Reproducibility

**User Story:** As a maintainer, I want OSS-only solutions with no hardcoded secrets, so that the setup is reproducible and auditable.

#### Acceptance Criteria

1. THE Gateway System SHALL use only open-source licensed components.
2. THE Gateway System SHALL operate without hardcoded credentials.
3. WHERE credentials are required, THE Gateway System SHALL accept credentials via environment variables or HTTP headers at runtime.

### Requirement 4: Example Schema Capabilities

**User Story:** As a developer, I want working example schemas, so that I can understand gateway capabilities and extend them.

#### Acceptance Criteria

1. THE Example Schema SHALL support entity lookup by IRI.
2. THE Example Schema SHALL support entity listing with pagination.
3. THE Example Schema SHALL support rdfs:label property access.
4. THE Example Schema SHALL support basic property traversal.

### Requirement 5: HyperGraphQL Configuration

**User Story:** As a developer, I want HyperGraphQL configuration templates, so that I can quickly set up a working gateway.

#### Acceptance Criteria

1. THE Gateway System SHALL provide HyperGraphQL configuration template.
2. THE HyperGraphQL configuration template SHALL include a working example schema.
3. THE HyperGraphQL configuration template SHALL include service mapping to SPARQL endpoints.

### Requirement 6: GraphQL-LD Documentation

**User Story:** As a developer, I want GraphQL-LD examples and documentation, so that I can run the Node.js gateway.

#### Acceptance Criteria

1. THE Gateway System SHALL provide GraphQL-LD server example code.
2. THE GraphQL-LD server example SHALL be runnable without daemonization.
3. THE Gateway System SHALL provide JSON-LD context example.

### Requirement 7: Multi-Store Configuration

**User Story:** As a developer, I want to switch between GraphDB and Fuseki without code changes, so that configuration is flexible.

#### Acceptance Criteria

1. THE Gateway System SHALL support GraphDB targeting via configuration or environment variables only.
2. THE Gateway System SHALL support Fuseki targeting via configuration or environment variables only.
3. THE Gateway System SHALL require no code changes when switching between GraphDB and Fuseki.

### Requirement 8: Optional Write Operations

**User Story:** As a developer, I want optional write capability examples, so that I understand mutation patterns while keeping writes disabled by default.

#### Acceptance Criteria

1. WHERE HyperGraphQL mutations are implemented, THE Gateway System SHALL map mutations to SPARQL Update operations.
2. WHERE HyperGraphQL mutations are implemented, THE Gateway System SHALL disable mutations by default.
3. WHERE HyperGraphQL mutations are implemented, THE Gateway System SHALL provide mutation examples in documentation.

### Requirement 9: Local Development Focus

**User Story:** As a developer, I want clear local development documentation, so that I can run gateways without CI complexity.

#### Acceptance Criteria

1. THE Gateway System SHALL provide documentation focused on local development usage.
2. THE Gateway System SHALL provide configuration documentation.
3. THE Gateway System SHALL provide start and stop procedures.
4. THE Gateway System SHALL provide troubleshooting guidance.


