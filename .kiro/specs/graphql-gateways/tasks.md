# Implementation Plan

- [x] 1. Create HyperGraphQL configuration templates
  - Create `tools/gateways/hypergraphql/config.json` with SPARQL_ENDPOINT variable substitution
  - Create `tools/gateways/hypergraphql/schema.graphql` with example entity schema
  - Support GraphDB and Fuseki endpoints via configuration
  - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2, 5.3, 7.1, 7.2, 7.3_

- [x] 1.1 Implement example schema with core capabilities
  - Add entity lookup by IRI
  - Add entity listing with pagination
  - Add rdfs:label property access
  - Add basic property traversal
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ]* 1.2 Write property test for SPARQL endpoint connectivity
  - **Property 1: SPARQL endpoint connectivity**
  - **Validates: Requirements 1.1**

- [ ]* 1.3 Write property test for entity lookup
  - **Property 4: Entity lookup by IRI**
  - **Validates: Requirements 4.1**

- [ ]* 1.4 Write property test for pagination consistency
  - **Property 5: Pagination consistency**
  - **Validates: Requirements 4.2**

- [ ]* 1.5 Write property test for property traversal
  - **Property 6: Property traversal completeness**
  - **Validates: Requirements 4.4**

- [x] 2. Create HyperGraphQL documentation
  - Create `tools/gateways/hypergraphql/README.md` with quickstart
  - Document Docker Desktop usage with Apple Silicon support
  - Document environment variable configuration
  - Document start and stop procedures
  - Include troubleshooting guidance
  - _Requirements: 2.1, 9.1, 9.2, 9.3, 9.4_

- [ ] 3. Create GraphQL-LD example implementation
  - Create minimal Node.js server example
  - Create JSON-LD context file
  - Support Node.js 18+ runtime
  - Ensure server is runnable without daemonization
  - _Requirements: 2.2, 6.1, 6.2_

- [ ] 3.1 Create GraphQL-LD documentation
  - Create `tools/gateways/graphql-ld/README.md` with quickstart
  - Document Node.js version requirements
  - Document environment variable configuration
  - Include example queries
  - _Requirements: 6.3, 9.1, 9.2, 9.3, 9.4_

- [ ] 4. Implement credential management
  - Ensure no hardcoded credentials in codebase
  - Support credentials via environment variables
  - Support credentials via HTTP headers at runtime
  - Document credential configuration
  - _Requirements: 3.1, 3.2, 3.3_

- [ ]* 4.1 Write property test for no hardcoded credentials
  - **Property 2: No hardcoded credentials**
  - **Validates: Requirements 3.2**

- [ ]* 4.2 Write property test for credential configuration flexibility
  - **Property 3: Credential configuration flexibility**
  - **Validates: Requirements 3.3**

- [ ] 5. Implement multi-store configuration support
  - Verify configuration works with GraphDB
  - Verify configuration works with Fuseki
  - Ensure no code changes required to switch stores
  - Document switching procedure
  - _Requirements: 7.1, 7.2, 7.3_

- [ ]* 5.1 Write property test for multi-store configuration flexibility
  - **Property 7: Multi-store configuration flexibility**
  - **Validates: Requirements 7.1, 7.2, 7.3**

- [ ] 6. Document optional write operations
  - Document mutation mapping to SPARQL Update
  - Ensure mutations are disabled by default
  - Provide mutation examples in documentation
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 7. Create comprehensive gateway README
  - Consolidate quickstart for both gateways
  - Document environment variable configuration
  - Provide example queries for common patterns
  - Include troubleshooting section
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 8. Validate with local sample data
  - Test HyperGraphQL with sample RDF data
  - Test GraphQL-LD with sample RDF data
  - Document example queries
  - Verify all schema capabilities work
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ]* 9. Add Docker Compose for local development
  - Create docker-compose.yml for HyperGraphQL + Fuseki
  - Support external SPARQL endpoint via environment variables
  - Include sample data loading
  - Document usage
  - _Requirements: 1.1, 1.2, 1.3, 2.1_

- [ ] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.


