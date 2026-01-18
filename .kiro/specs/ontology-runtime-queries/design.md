# Design Document: Ontology Runtime Queries

## Overview

The Ontology Runtime Queries system provides controlled, read-only runtime query capabilities over ontology datasets for internal tooling and selected applications. The system provides strong guardrails and edge protections while enabling GraphQL and SPARQL access. It adopts shared policies from ontology-core-platform for versioning, validation gates, metadata, Cloudflare baseline, configuration schema, limits, observability, performance budgets, and release workflow.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Internal Applications                     │
│              (Tools, Dashboards, Services)                   │
└────────────────────────┬────────────────────────────────────┘
                         │ GraphQL/SPARQL Queries
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge                           │
├──────────────────────────┬──────────────────────────────────┤
│   Cloudflare Access      │   WAF + Rate Limiting            │
│   - SSO Authentication   │   - Attack Protection            │
│   - Token Validation     │   - Request Throttling           │
└──────────────────────────┴──────────────────────────────────┘
                         │ mTLS or Token Auth
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    GraphQL Gateway                           │
├──────────────────────────┬──────────────────────────────────┤
│   HyperGraphQL           │   GraphQL-LD + Comunica          │
│   - Query Translation    │   - Flexible Queries             │
│   - Depth/Complexity     │   - JSON-LD Contexts             │
└──────────────────────────┴──────────────────────────────────┘
                         │ SPARQL Queries
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    RDF Store                                 │
├──────────────────────────┬──────────────────────────────────┤
│   Apache Jena Fuseki     │   GraphDB (Licensed)             │
│   + TDB2 (Default)       │   (Optional)                     │
│   - Read-Only Dataset    │   - Read-Only Dataset            │
│   - Timeouts             │   - Timeouts                     │
│   - Result Limits        │   - Result Limits                │
└──────────────────────────┴──────────────────────────────────┘
```

## Components and Interfaces

### 1. RDF Store Component

**Default: Apache Jena Fuseki + TDB2**
- Open-source SPARQL 1.1 server
- TDB2 native RDF storage
- Read-only dataset snapshots
- Query timeouts and result limits

**Optional: GraphDB**
- Commercial RDF database (where licensed)
- Advanced query optimization
- Full-text search capabilities
- Inference support

**Configuration:**
- `SPARQL_ENDPOINT`: Query endpoint URL
- `SPARQL_UPDATE_ENDPOINT`: Update endpoint (disabled in production)
- Dataset loaded from immutable published artifacts

### 2. GraphQL Gateway Component

**HyperGraphQL Option:**
- Java-based gateway
- Configuration-driven schema
- SPARQL query translation
- Depth and complexity limits

**GraphQL-LD Option:**
- Node.js-based gateway
- Comunica query engine
- JSON-LD context-based mapping
- Flexible query patterns

**Features:**
- Query depth limiting
- Query complexity limiting
- Timeout enforcement
- Result pagination

### 3. Security Component

**Cloudflare Access:**
- SSO authentication (Google, GitHub, etc.)
- Token-based authentication
- Per-user access policies
- Audit logging

**WAF Protection:**
- OWASP Core Rule Set
- Custom rules for GraphQL/SPARQL
- Rate limiting per IP/token
- DDoS protection

**mTLS or Token Auth:**
- Secure edge-to-origin communication
- Token validation
- Certificate pinning (mTLS)

### 4. Resource Limits Component

**Query Limits:**
- Server-side query timeouts (default: 30s)
- Maximum results per query (default: 1000)
- Pagination enforcement
- Per-token query quotas

**GraphQL Limits:**
- Query depth limit (default: 10)
- Query complexity limit (default: 1000)
- Field count limits
- Alias limits

**SPARQL Restrictions:**
- SPARQL Update disabled in production
- Raw SPARQL access restricted to trusted services
- Query pattern restrictions (optional)

### 5. Caching Component

**Persisted Queries:**
- Pre-registered queries identified by hash
- Enable safe GET requests
- Edge caching support
- Query allowlist

**Edge Caching:**
- Cache persisted query results at Cloudflare edge
- Configurable TTLs per query
- Cache purge on new release
- Cache bypass header support

**Cache Strategy:**
- Short TTLs for dynamic data (5-60 minutes)
- Long TTLs for stable data (1-24 hours)
- Vary on authentication context
- Purge on dataset updates

### 6. Dataset Management Component

**Ingestion:**
- Load from immutable published artifacts
- Controlled pipeline only
- Read-only snapshots per release/environment
- Validation before loading

**Isolation:**
- Separate datasets per environment (dev, staging, prod)
- No direct write access
- Snapshot-based updates
- Rollback capability

### 7. Observability Component

**Structured Logging:**
- Correlation IDs for request tracing
- Query IDs for debugging
- Duration tracking
- Row count tracking
- User/session IDs (when available)

**Dashboards:**
- p50/p95 latency
- Error rate by type
- Query volume
- Cache hit ratio
- Resource utilization

**Alerts:**
- Performance regressions (p95 > 250ms)
- High error rate (> 1%)
- Resource saturation (CPU, memory, disk)
- Authentication failures

## Data Models

### Query Request Model

```typescript
interface QueryRequest {
  query: string;              // GraphQL query
  variables?: object;         // Query variables
  operationName?: string;     // Operation name
  persistedQueryId?: string;  // Persisted query hash
}
```

### Query Response Model

```typescript
interface QueryResponse {
  data?: object;              // Query results
  errors?: QueryError[];      // Errors if any
  extensions?: {
    correlationId: string;    // Request correlation ID
    queryId: string;          // Query identifier
    duration: number;         // Duration in ms
    cached: boolean;          // Whether result was cached
  };
}
```

### Log Entry Model

```typescript
interface LogEntry {
  timestamp: string;
  level: string;
  correlationId: string;
  queryId: string;
  userId?: string;
  sessionId?: string;
  duration: number;
  rowCount: number;
  cached: boolean;
  error?: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: SPARQL access restriction
*For any* request attempting raw SPARQL access, the system should deny access unless the request comes from a trusted service with valid credentials
**Validates: Requirements 2.2**

### Property 2: Authentication requirement
*For any* query request, the system should require valid authentication via Cloudflare Access with SSO or token
**Validates: Requirements 3.1**

### Property 3: Resource limit enforcement
*For any* query execution, the system should enforce server-side timeouts, maximum result limits, and pagination requirements
**Validates: Requirements 4.1, 4.2, 4.3**

### Property 4: GraphQL complexity limits
*For any* GraphQL query, the system should enforce depth and complexity limits and reject queries exceeding thresholds
**Validates: Requirements 4.5, 4.6**

### Property 5: Persisted query caching
*For any* persisted query executed via GET request, the result should be cached at the edge with configurable TTL
**Validates: Requirements 5.1, 5.2, 5.3**

### Property 6: Cache invalidation on release
*For any* new ontology release publication, the system should purge all edge caches
**Validates: Requirements 5.4**

### Property 7: Dataset read-only enforcement
*For any* dataset in production, write operations should be disabled and only read operations should be permitted
**Validates: Requirements 4.7, 6.1**

### Property 8: Structured logging completeness
*For any* query execution, the log entry should contain correlation ID, query ID, duration, and row count
**Validates: Requirements 7.1**

### Property 9: Performance budget compliance
*For any* query at low request rate with warm cache, p95 latency should be below 250 milliseconds
**Validates: Requirements 9.1**

### Property 10: Admin operation audit logging
*For any* administrative operation, the system should capture an audit trail entry
**Validates: Requirements 10.1**

## Error Handling

### Authentication Errors

**Missing Credentials:**
- Return 401 Unauthorized
- Provide clear error message
- Suggest authentication methods

**Invalid Credentials:**
- Return 401 Unauthorized
- Log authentication attempt
- Rate limit failed attempts

### Authorization Errors

**Insufficient Permissions:**
- Return 403 Forbidden
- Log authorization failure
- Provide minimal error details

### Query Errors

**Timeout:**
- Return 504 Gateway Timeout
- Include timeout duration in error
- Suggest query optimization

**Result Limit Exceeded:**
- Return 400 Bad Request
- Indicate maximum result limit
- Suggest pagination

**Complexity Limit Exceeded:**
- Return 400 Bad Request
- Include complexity score
- Suggest query simplification

### Resource Errors

**Quota Exceeded:**
- Return 429 Too Many Requests
- Include quota limits
- Provide reset time

**Service Unavailable:**
- Return 503 Service Unavailable
- Indicate retry-after duration
- Log service health status

## Testing Strategy

### Unit Testing

**Query Limits:**
- Test timeout enforcement
- Test result limit enforcement
- Test pagination logic

**Authentication:**
- Test token validation
- Test SSO integration
- Test credential handling

**Caching:**
- Test cache key generation
- Test TTL handling
- Test cache invalidation

### Property-Based Testing

Property-based tests will verify universal properties using **fast-check** (JavaScript) and **Hypothesis** (Python):

**Configuration:**
- Minimum 100 iterations per property test
- Generate random queries, limits, and credentials

**Property Tests:**
- Each correctness property will have a corresponding property-based test
- Tests annotated with: `**Feature: ontology-runtime-queries, Property N: <property text>**`
- Tests reference requirements: `**Validates: Requirements X.Y**`

### Integration Testing

**End-to-End Query Flow:**
- Authenticate via Cloudflare Access
- Execute GraphQL query
- Verify results
- Check logs and metrics

**Multi-Store Testing:**
- Test with Fuseki
- Test with GraphDB
- Verify identical results

### Performance Testing

**Load Testing:**
- Simulate concurrent users
- Measure p50/p95/p99 latency
- Verify performance budgets
- Test cache effectiveness

## Implementation Notes

### Technology Stack

**RDF Store:**
- Apache Jena Fuseki 4.x + TDB2 (default)
- GraphDB 10.x (optional, where licensed)

**Gateway:**
- HyperGraphQL (Java) or GraphQL-LD (Node.js)
- Comunica query engine (for GraphQL-LD)

**Edge:**
- Cloudflare Access for authentication
- Cloudflare WAF for protection
- Cloudflare Workers for caching logic

### Deployment

**Fuseki Deployment:**
```bash
# Start Fuseki with read-only dataset
fuseki-server --loc=/data/tdb2 --update=false /dataset
```

**Gateway Deployment:**
```bash
# HyperGraphQL
docker run -p 8080:8080 \
  -e SPARQL_ENDPOINT="http://fuseki:3030/dataset/sparql" \
  hypergraphql/hypergraphql

# GraphQL-LD
export SPARQL_ENDPOINT="http://fuseki:3030/dataset/sparql"
node server.mjs
```

### Configuration

**Environment Variables:**
- `SPARQL_ENDPOINT`: Query endpoint URL
- `AUTH_MODE`: Authentication mode (access, token, mtls)
- `CACHE_TTL_S`: Default cache TTL in seconds
- `QUERY_TIMEOUT_S`: Query timeout in seconds
- `MAX_RESULTS`: Maximum results per query
- `MAX_DEPTH`: Maximum GraphQL query depth
- `MAX_COMPLEXITY`: Maximum GraphQL query complexity

## Security Considerations

### Defense in Depth

**Layer 1: Cloudflare Edge**
- WAF rules
- Rate limiting
- DDoS protection
- Bot management

**Layer 2: Cloudflare Access**
- SSO authentication
- Token validation
- Access policies
- Audit logging

**Layer 3: Gateway**
- Query validation
- Complexity limits
- Timeout enforcement
- Result limiting

**Layer 4: RDF Store**
- Read-only mode
- Network isolation
- Resource limits

### Secrets Management

**No Hardcoded Secrets:**
- All credentials via environment variables
- Token rotation support
- Certificate management (mTLS)

**Audit Logging:**
- Log all authentication attempts
- Log all admin operations
- Retain logs per compliance requirements

## Performance Considerations

### Query Optimization

**SPARQL Optimization:**
- Use indexes on common predicates
- Optimize query patterns
- Use LIMIT and OFFSET
- Avoid expensive operations (OPTIONAL, UNION)

**GraphQL Optimization:**
- Use DataLoader pattern
- Batch related queries
- Implement field-level caching
- Use persisted queries

### Caching Strategy

**Cache Layers:**
1. Edge cache (Cloudflare CDN)
2. Gateway cache (in-memory)
3. Store cache (query results)

**Cache Keys:**
- Include query hash
- Include authentication context
- Include dataset version

### Monitoring

**Key Metrics:**
- Query latency percentiles
- Cache hit ratio
- Error rate by type
- Resource utilization
- Active connections

## Maintenance and Operations

### Dataset Updates

1. **Build**: New ontology release published
2. **Download**: Download immutable artifacts
3. **Validate**: Validate artifacts
4. **Load**: Load into new dataset
5. **Test**: Verify queries work
6. **Switch**: Update endpoint configuration
7. **Purge**: Invalidate caches

### Runbooks

**Common Operations:**
- Loading new dataset
- Switching between datasets
- Investigating slow queries
- Debugging authentication issues
- Scaling resources

### Troubleshooting

**Slow Queries:**
- Check query complexity
- Review SPARQL query plan
- Check store indexes
- Review cache hit ratio

**Authentication Failures:**
- Verify Cloudflare Access configuration
- Check token validity
- Review access policies
- Check audit logs

## Future Enhancements

### Advanced Features

**Query Federation:**
- Query across multiple datasets
- Distributed query execution
- Result merging

**Real-Time Updates:**
- GraphQL subscriptions
- Change notifications
- Event streaming

**Advanced Analytics:**
- Query plan analysis
- Cost attribution
- Capacity planning
- Anomaly detection
