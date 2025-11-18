# Design Document: GraphQL Gateways

## Overview

The GraphQL Gateways feature provides GraphQL-to-SPARQL translation services using HyperGraphQL and GraphQL-LD with Comunica. These gateways enable read access to RDF datasets via GraphQL APIs without replacing existing SPARQL workflows. The system is designed for local development on macOS with Docker Desktop and Node.js, using only open-source components.

The gateways act as a translation layer between GraphQL clients and SPARQL endpoints, allowing developers to query RDF data using familiar GraphQL syntax while maintaining the flexibility and power of SPARQL backends.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      GraphQL Clients                         │
│                   (Applications, Tools)                      │
└────────────────────────┬────────────────────────────────────┘
                         │ GraphQL Queries
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Gateway Layer                             │
├──────────────────────────┬──────────────────────────────────┤
│   HyperGraphQL           │      GraphQL-LD + Comunica       │
│   (Java, Docker)         │      (Node.js)                   │
│   - Config-driven        │      - JSON-LD contexts          │
│   - Schema mapping       │      - Flexible queries          │
└──────────────────────────┴──────────────────────────────────┘
                         │ SPARQL Queries
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    SPARQL Endpoints                          │
├──────────────────────────┬──────────────────────────────────┤
│      GraphDB             │      Apache Jena Fuseki          │
│   (Commercial/Free)      │      (Open Source)               │
└──────────────────────────┴──────────────────────────────────┘
```

### Component Interaction

1. **Client Layer**: Applications send GraphQL queries
2. **Gateway Layer**: Translates GraphQL to SPARQL
3. **Endpoint Layer**: Executes SPARQL queries on RDF data
4. **Response Flow**: SPARQL results → GraphQL response format

## Components and Interfaces

### 1. HyperGraphQL Gateway Component

**Responsibilities:**
- Translate GraphQL queries to SPARQL
- Map GraphQL schema to RDF vocabularies
- Support entity lookup and pagination
- Run in Docker container with Apple Silicon support

**Configuration:**
- `config.json`: Service configuration with SPARQL endpoint URL
- `schema.graphql`: GraphQL schema with RDF mappings
- Environment variable: `SPARQL_ENDPOINT`

**Key Features:**
- Configuration-driven (no code changes for new schemas)
- Supports multiple SPARQL services
- Optional mutation support (disabled by default)
- Timeout configuration

**Example Configuration:**
```json
{
  "name": "ontology-gateway",
  "schema": "schema.graphql",
  "timeout": 30000,
  "services": [
    {
      "id": "sparql",
      "type": "SPARQL",
      "url": "${SPARQL_ENDPOINT}"
    }
  ]
}
```

### 2. GraphQL-LD Gateway Component

**Responsibilities:**
- Translate GraphQL queries to SPARQL using JSON-LD contexts
- Use Comunica query engine for flexible SPARQL execution
- Support Node.js 18+ runtime
- Provide runnable server example

**Configuration:**
- JSON-LD context files
- Server configuration (port, endpoint)
- Environment variable: `SPARQL_ENDPOINT`

**Key Features:**
- JSON-LD context-based mapping
- Comunica engine for advanced queries
- Lightweight Node.js deployment
- No daemonization required

### 3. Example Schema Component

**Responsibilities:**
- Demonstrate entity lookup by IRI
- Demonstrate entity listing with pagination
- Demonstrate property access (rdfs:label)
- Demonstrate basic property traversal

**Schema Capabilities:**
```graphql
type Entity {
  id: ID!
  label: String
  properties: [Property]
}

type Query {
  entity(iri: String!): Entity
  entities(limit: Int, offset: Int): [Entity]
}
```

### 4. Configuration Management Component

**Responsibilities:**
- Read SPARQL_ENDPOINT from environment
- Support GraphDB and Fuseki endpoints
- Accept credentials via environment variables or HTTP headers
- No hardcoded secrets

**Environment Variables:**
- `SPARQL_ENDPOINT`: SPARQL query endpoint URL (required)
- `SPARQL_UPDATE_ENDPOINT`: SPARQL update endpoint URL (optional)
- `AUTH_TOKEN`: Authentication token (optional)
- `AUTH_HEADER`: Authentication header name (optional)

### 5. Documentation Component

**Responsibilities:**
- Provide local development quickstart
- Document configuration options
- Provide start and stop procedures
- Include troubleshooting guidance

**Documentation Structure:**
- README with quickstart
- Configuration examples
- Example queries
- Troubleshooting section

## Data Models

### GraphQL Schema Model

```graphql
# Entity type representing RDF resources
type Entity {
  iri: ID!
  label: String
  type: String
  properties: [Property]
}

# Property type for RDF predicates
type Property {
  predicate: String!
  value: String
  object: Entity
}

# Query root
type Query {
  # Lookup entity by IRI
  entity(iri: String!): Entity
  
  # List entities with pagination
  entities(
    limit: Int = 10
    offset: Int = 0
  ): EntityConnection
}

# Pagination support
type EntityConnection {
  nodes: [Entity]
  totalCount: Int
  pageInfo: PageInfo
}

type PageInfo {
  hasNextPage: Boolean
  hasPreviousPage: Boolean
}
```

### SPARQL Mapping Model

**Entity Lookup:**
```sparql
SELECT ?label ?type
WHERE {
  <${iri}> rdfs:label ?label .
  OPTIONAL { <${iri}> rdf:type ?type }
}
```

**Entity Listing:**
```sparql
SELECT ?iri ?label
WHERE {
  ?iri rdf:type ?type .
  ?iri rdfs:label ?label .
}
LIMIT ${limit}
OFFSET ${offset}
```

**Property Traversal:**
```sparql
SELECT ?predicate ?value
WHERE {
  <${iri}> ?predicate ?value .
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: SPARQL endpoint connectivity
*For any* valid SPARQL 1.1 endpoint URL provided via SPARQL_ENDPOINT environment variable, the gateway should successfully connect and execute queries
**Validates: Requirements 1.1**

### Property 2: No hardcoded credentials
*For any* source file in the gateway codebase, it should not contain hardcoded credentials, passwords, tokens, or API keys
**Validates: Requirements 3.2**

### Property 3: Credential configuration flexibility
*For any* required credential, the gateway should accept it via environment variables or HTTP headers at runtime
**Validates: Requirements 3.3**

### Property 4: Entity lookup by IRI
*For any* valid IRI in the dataset, querying the entity by IRI should return the entity's properties or null if not found
**Validates: Requirements 4.1**

### Property 5: Pagination consistency
*For any* entity listing query with pagination parameters (limit, offset), the total number of entities across all pages should equal the total count, and no entities should be duplicated or skipped
**Validates: Requirements 4.2**

### Property 6: Property traversal completeness
*For any* entity IRI, traversing properties should return all predicates and values associated with that entity in the RDF graph
**Validates: Requirements 4.4**

### Property 7: Multi-store configuration flexibility
*For any* SPARQL endpoint (GraphDB or Fuseki), switching between endpoints should require only configuration changes (environment variables), not code changes
**Validates: Requirements 7.1, 7.2, 7.3**

## Error Handling

### Connection Errors

**SPARQL Endpoint Unreachable:**
- Return clear error message indicating endpoint is unreachable
- Include endpoint URL in error (without credentials)
- Suggest checking SPARQL_ENDPOINT configuration
- HTTP 503 Service Unavailable

**Authentication Failures:**
- Return clear error message indicating authentication failed
- Suggest checking credentials configuration
- Do not expose credential values in errors
- HTTP 401 Unauthorized

### Query Errors

**Invalid GraphQL Query:**
- Return GraphQL validation errors
- Include query location (line, column)
- Provide helpful error messages
- HTTP 400 Bad Request

**SPARQL Translation Errors:**
- Return error indicating translation failure
- Include problematic GraphQL fragment
- Suggest schema limitations
- HTTP 400 Bad Request

**SPARQL Execution Errors:**
- Return error from SPARQL endpoint
- Include SPARQL error message
- Suggest query modifications
- HTTP 500 Internal Server Error

### Configuration Errors

**Missing SPARQL_ENDPOINT:**
- Fail at startup with clear error message
- Provide example configuration
- Exit with non-zero status code

**Invalid Configuration File:**
- Fail at startup with validation errors
- Indicate which configuration fields are invalid
- Provide corrected example
- Exit with non-zero status code

### Timeout Errors

**Query Timeout:**
- Return timeout error after configured duration
- Include timeout value in error message
- Suggest query optimization or timeout increase
- HTTP 504 Gateway Timeout

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

**Configuration:**
- Test environment variable reading
- Test configuration file parsing
- Test missing configuration handling
- Test invalid configuration handling

**Schema:**
- Test schema loading and validation
- Test GraphQL query parsing
- Test SPARQL translation for known queries

**Connectivity:**
- Test connection to mock SPARQL endpoint
- Test authentication header injection
- Test timeout handling

### Property-Based Testing

Property-based tests will verify universal properties across random inputs using **fast-check** (JavaScript/Node.js):

**Configuration:**
- Minimum 100 iterations per property test
- Use fast-check for all property tests
- Generate random valid and invalid configurations

**Property Tests:**
- Each correctness property will have a corresponding property-based test
- Tests will generate random IRIs, pagination parameters, and queries
- Tests will verify properties hold across all generated inputs
- Edge cases (empty results, large offsets, special characters in IRIs) will be covered

**Test Organization:**
- Property tests co-located with source files using `.test.mjs` or `.test.js` suffix
- Each test annotated with: `**Feature: graphql-gateways, Property N: <property text>**`
- Each test references requirements: `**Validates: Requirements X.Y**`

### Integration Testing

Integration tests will verify end-to-end workflows:

**HyperGraphQL Integration:**
- Start HyperGraphQL container
- Execute example queries
- Verify responses match expected format
- Test pagination
- Test error handling

**GraphQL-LD Integration:**
- Start GraphQL-LD server
- Execute example queries
- Verify responses match expected format
- Test with different JSON-LD contexts

**Multi-Store Integration:**
- Test with GraphDB endpoint
- Test with Fuseki endpoint
- Verify identical results from both stores
- Test switching between stores

### Manual Testing

Manual testing will verify local development experience:

**Docker Desktop:**
- Verify HyperGraphQL runs on Apple Silicon
- Test container startup and shutdown
- Verify resource usage is reasonable

**Node.js:**
- Verify GraphQL-LD runs on Node 18+
- Test server startup and shutdown
- Verify no daemonization required

## Implementation Notes

### Technology Stack

**HyperGraphQL:**
- Java-based gateway
- Docker container deployment
- Configuration-driven schema mapping
- Supports GraphQL subscriptions (optional)

**GraphQL-LD:**
- Node.js-based gateway
- Comunica query engine
- JSON-LD context-based mapping
- Lightweight and flexible

**SPARQL Endpoints:**
- GraphDB: Commercial/free RDF database
- Apache Jena Fuseki: Open-source SPARQL server
- Both support SPARQL 1.1 protocol

### Deployment Patterns

**Local Development (HyperGraphQL):**
```bash
docker run --rm -p 8080:8080 \
  -e SPARQL_ENDPOINT="http://host.docker.internal:3030/dataset/sparql" \
  -v "$(pwd)/config:/app/config" \
  hypergraphql/hypergraphql:latest \
  --config /app/config/config.json
```

**Local Development (GraphQL-LD):**
```bash
export SPARQL_ENDPOINT="http://localhost:3030/dataset/sparql"
node server.mjs
```

### Configuration Management

**Environment Variables:**
- Use `${VAR_NAME}` syntax in configuration files
- Substitute at runtime
- Fail fast if required variables are missing

**Secrets:**
- Never commit credentials to version control
- Use environment variables for all secrets
- Support credential injection via HTTP headers
- Document credential requirements clearly

### Schema Design

**Best Practices:**
- Map GraphQL types to RDF classes
- Map GraphQL fields to RDF properties
- Use IRIs as GraphQL IDs
- Support pagination for all list queries
- Provide clear field descriptions
- Use nullable types appropriately

**Example Mapping:**
```graphql
type Entity @rdf(type: "http://example.org/Entity") {
  iri: ID! @rdf(predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#about")
  label: String @rdf(predicate: "http://www.w3.org/2000/01/rdf-schema#label")
}
```

## Security Considerations

### Authentication

**Token-Based Authentication:**
- Support Bearer tokens via Authorization header
- Support custom token headers
- Validate tokens before query execution
- Do not log token values

**No Authentication:**
- Support public read-only access
- Document security implications
- Recommend authentication for production

### Authorization

**Query-Level Authorization:**
- Filter results based on user permissions (future)
- Deny access to restricted predicates (future)
- Log authorization decisions

**Endpoint-Level Authorization:**
- Restrict access to admin endpoints
- Require authentication for mutations
- Use Cloudflare Access for production

### Input Validation

**GraphQL Query Validation:**
- Validate against schema
- Enforce query depth limits
- Enforce query complexity limits
- Reject malformed queries

**IRI Validation:**
- Validate IRI format
- Prevent injection attacks
- Sanitize user input

### Rate Limiting

**Request Rate Limiting:**
- Implement at gateway level (future)
- Use Cloudflare rate limiting for production
- Return 429 Too Many Requests

**Query Complexity Limiting:**
- Calculate query complexity score
- Reject queries exceeding threshold
- Provide complexity in error message

## Performance Considerations

### Query Performance

**Optimization Strategies:**
- Use SPARQL query optimization
- Implement result caching
- Use connection pooling
- Batch related queries

**Pagination:**
- Always use LIMIT and OFFSET
- Provide reasonable default limits
- Warn on large page sizes
- Consider cursor-based pagination

### Caching

**Result Caching:**
- Cache query results at gateway level
- Use query hash as cache key
- Support cache TTL configuration
- Implement cache invalidation

**Schema Caching:**
- Cache compiled GraphQL schema
- Reload on configuration changes
- Validate schema at startup

### Monitoring

**Key Metrics:**
- Query latency (p50, p95, p99)
- Query error rate
- SPARQL endpoint latency
- Cache hit ratio
- Active connections

**Logging:**
- Log all queries (with sanitization)
- Log query duration
- Log errors with context
- Use structured logging format

## Maintenance and Operations

### Local Development Workflow

1. **Start SPARQL Endpoint**: Start GraphDB or Fuseki locally
2. **Configure Gateway**: Set SPARQL_ENDPOINT environment variable
3. **Start Gateway**: Run HyperGraphQL container or GraphQL-LD server
4. **Test Queries**: Use GraphQL Playground or curl
5. **Iterate**: Modify schema and restart gateway

### Troubleshooting

**Common Issues:**

**Gateway won't start:**
- Check SPARQL_ENDPOINT is set
- Verify configuration file syntax
- Check Docker Desktop is running (HyperGraphQL)
- Check Node.js version (GraphQL-LD)

**Queries return errors:**
- Verify SPARQL endpoint is reachable
- Check query syntax
- Verify schema mappings
- Check SPARQL endpoint logs

**Slow queries:**
- Check SPARQL query complexity
- Verify SPARQL endpoint performance
- Consider adding indexes to RDF store
- Implement caching

**Connection refused:**
- Verify SPARQL endpoint URL
- Check network connectivity
- Verify firewall rules
- Check authentication credentials

### Runbooks

**Starting HyperGraphQL:**
1. Ensure Docker Desktop is running
2. Set SPARQL_ENDPOINT environment variable
3. Run docker command with config volume mount
4. Verify gateway is accessible at http://localhost:8080

**Starting GraphQL-LD:**
1. Ensure Node.js 18+ is installed
2. Set SPARQL_ENDPOINT environment variable
3. Run `node server.mjs`
4. Verify gateway is accessible at http://localhost:4000

**Switching SPARQL Endpoints:**
1. Stop gateway
2. Update SPARQL_ENDPOINT environment variable
3. Start gateway
4. Verify connectivity with test query

## Future Enhancements

### Phase 2 Features

**Mutation Support:**
- Map GraphQL mutations to SPARQL Update
- Implement transaction support
- Add conflict resolution
- Require authentication

**Advanced Caching:**
- Implement persisted queries
- Add edge caching support
- Implement cache warming
- Add cache analytics

**Enhanced Security:**
- Implement fine-grained authorization
- Add query auditing
- Implement rate limiting at gateway
- Add query signing

**Performance Optimization:**
- Implement query batching
- Add DataLoader pattern
- Implement query result streaming
- Add query plan caching

### Extensibility

**Custom Directives:**
- Add custom GraphQL directives
- Implement directive handlers
- Support plugin system

**Multiple Endpoints:**
- Support federated queries
- Implement endpoint routing
- Add load balancing

**Monitoring Integration:**
- Add Prometheus metrics
- Integrate with Grafana
- Add distributed tracing
- Implement health checks
