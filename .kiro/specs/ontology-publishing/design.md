# Design Document: Ontology Publishing

## Overview

The Ontology Publishing system provides static, versioned ontology publishing with stable URIs and content negotiation served via Cloudflare. The system publishes immutable artifacts without requiring runtime servers for public consumption. It adopts shared policies from ontology-core-platform for versioning, validation gates, metadata, Cloudflare baseline, configuration schema, limits, observability, performance budgets, and release workflow.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Ontology Consumers                      │
│              (Browsers, Tools, Applications)                 │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP Requests (with Accept headers)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge                           │
├──────────────────────────┬──────────────────────────────────┤
│   CDN Cache              │   Cloudflare Worker              │
│   - Long TTLs            │   - Content Negotiation          │
│   - Gzip/Brotli          │   - Header Routing               │
└──────────────────────────┴──────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare R2 Storage                     │
│                  (Immutable Artifacts)                       │
├─────────────────────────────────────────────────────────────┤
│  /releases/1.0.0/                                           │
│    ├── ontology.ttl                                         │
│    ├── ontology.jsonld                                      │
│    ├── ontology.html (pyLODE)                               │
│    ├── metadata/void.ttl                                    │
│    └── CITATION.cff                                         │
│  /releases/1.0.1/                                           │
│  /latest -> /releases/1.0.1/                                │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Content Negotiation Worker

**Responsibilities:**
- Inspect Accept header from client requests
- Route to appropriate format (Turtle, JSON-LD, HTML)
- Set appropriate Content-Type headers
- Handle version resolution (/latest)

**Supported Formats:**
- `text/turtle` → `.ttl` files
- `application/ld+json` → `.jsonld` files
- `text/html` → `.html` files (pyLODE documentation)

### 2. Build Pipeline Component

**Responsibilities:**
- Generate Turtle format files
- Generate JSON-LD format files
- Generate pyLODE HTML documentation
- Generate JSON-LD contexts for key vocabularies

**Inputs:**
- Ontology modules (from `ontology/` directory)
- Data files (from `data/` directory)
- SHACL shapes (from `shapes/` directory)

**Outputs:**
- `build/words-v1.ttl`: Assembled Turtle file
- `build/words-v1.jsonld`: JSON-LD representation
- `build/words-v1.html`: pyLODE HTML documentation
- `build/contexts/*.jsonld`: JSON-LD contexts

### 3. Metadata Generation Component

**Responsibilities:**
- Generate VoID or DCAT metadata describing datasets
- Include release timestamp in provenance metadata
- Include git commit hash in provenance metadata
- Include SHACL validation reports

**Metadata Files:**
- `metadata/void.ttl`: VoID dataset description
- `metadata/provenance.ttl`: Git commit and timestamp
- `metadata/shacl-report.txt`: Validation report
- `CITATION.cff`: Citation metadata

### 4. Release Automation Component

**Responsibilities:**
- Trigger on git tag creation
- Build all artifacts
- Push artifacts to Cloudflare R2
- Update /latest pointer
- Invalidate CDN cache

**CI Workflow:**
```yaml
on:
  push:
    tags:
      - 'v*.*.*'
steps:
  - Build artifacts
  - Validate artifacts
  - Upload to R2
  - Update /latest
  - Purge cache
```

### 5. Storage Component

**Responsibilities:**
- Store artifacts with immutable keys
- Prevent overwrites of versioned paths
- Support efficient retrieval
- Enable CDN caching

**Storage Structure:**
```
/releases/
  1.0.0/
    ontology.ttl
    ontology.jsonld
    ontology.html
    contexts/
    metadata/
    CITATION.cff
  1.0.1/
    ...
/latest -> 1.0.1
```

### 6. Edge Performance Component

**Responsibilities:**
- Perform content negotiation via Cloudflare Worker
- Set Cache-Control headers with long TTLs
- Support gzip compression
- Support brotli compression

**Cache Headers:**
```
Cache-Control: public, max-age=31536000, immutable
Content-Encoding: br
Vary: Accept
```

## Data Models

### Release Artifact Structure

```
releases/
├── 1.0.0/
│   ├── ontology.ttl
│   ├── ontology.jsonld
│   ├── ontology.html
│   ├── contexts/
│   │   ├── core.jsonld
│   │   ├── diversity.jsonld
│   │   └── energy.jsonld
│   ├── metadata/
│   │   ├── void.ttl
│   │   ├── provenance.ttl
│   │   └── shacl-report.txt
│   ├── CITATION.cff
│   └── MANIFEST.sha256
└── latest -> 1.0.0/
```

### VoID Metadata Example

```turtle
@prefix void: <http://rdfs.org/ns/void#> .
@prefix dcterms: <http://purl.org/dc/terms/> .

<http://example.org/dataset/words-1.0.0> a void:Dataset ;
    dcterms:title "WORDS Ontology v1.0.0" ;
    dcterms:description "Ontology for diversity and energy analysis" ;
    dcterms:created "2025-11-17T00:00:00Z"^^xsd:dateTime ;
    dcterms:creator <http://example.org/organization> ;
    void:triples 1234 ;
    void:vocabulary <http://example.org/words/core> .
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Content negotiation for Turtle
*For any* canonical IRI request with Accept header `text/turtle`, the Publishing System should return Turtle representation with Content-Type `text/turtle`
**Validates: Requirements 1.1**

### Property 2: Content negotiation for JSON-LD
*For any* canonical IRI request with Accept header `application/ld+json`, the Publishing System should return JSON-LD representation with Content-Type `application/ld+json`
**Validates: Requirements 1.2**

### Property 3: Content negotiation for HTML
*For any* canonical IRI request with Accept header `text/html`, the Publishing System should return HTML representation with Content-Type `text/html`
**Validates: Requirements 1.3**

### Property 4: Versioned path structure
*For any* release version, the artifact path should follow the format `/releases/Major.Minor.Patch/` exactly
**Validates: Requirements 2.1**

### Property 5: Release immutability
*For any* versioned release path, attempting to overwrite existing artifacts should fail
**Validates: Requirements 2.3**

### Property 6: Multiple format completeness
*For any* release, it should contain Turtle, JSON-LD, pyLODE HTML, and JSON-LD context files
**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 7: Metadata completeness
*For any* release, it should contain VoID/DCAT metadata with release timestamp and git commit hash
**Validates: Requirements 4.1, 4.2, 4.3**

### Property 8: Cache header correctness
*For any* artifact response, it should include Cache-Control headers with long TTL and support gzip or brotli compression
**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

### Property 9: Storage immutability
*For any* artifact stored with an immutable key, the storage system should prevent overwrites
**Validates: Requirements 8.1, 8.2**

### Property 10: Public access control
*For any* public GET request to published artifacts, the system should allow access without authentication
**Validates: Requirements 10.1**

## Error Handling

### Build Errors

**Validation Failures:**
- Fail CI build on SHACL violations
- Include validation report in output
- Prevent artifact publication

**Format Generation Failures:**
- Fail build if any format cannot be generated
- Report which format failed
- Provide error details

### Deployment Errors

**R2 Upload Failures:**
- Retry with exponential backoff
- Fail CI if retries exhausted
- Preserve local artifacts for debugging

**Cache Invalidation Failures:**
- Log warning but don't fail deployment
- Provide manual invalidation instructions
- Monitor cache staleness

### Runtime Errors

**404 Not Found:**
- Return clear error message
- Suggest checking version number
- Provide link to available versions

**Content Negotiation Failures:**
- Return 406 Not Acceptable
- List supported formats
- Provide example Accept headers

## Testing Strategy

### Unit Testing

**Build Pipeline:**
- Test Turtle generation
- Test JSON-LD generation
- Test pyLODE HTML generation
- Test context generation

**Metadata Generation:**
- Test VoID metadata generation
- Test provenance metadata
- Test CITATION.cff generation

**Path Generation:**
- Test version path formatting
- Test /latest pointer creation

### Property-Based Testing

Property-based tests will verify universal properties using **fast-check** (JavaScript) for Worker and **Hypothesis** (Python) for build pipeline:

**Configuration:**
- Minimum 100 iterations per property test
- Generate random versions, Accept headers, and paths

**Property Tests:**
- Each correctness property will have a corresponding property-based test
- Tests annotated with: `**Feature: ontology-publishing, Property N: <property text>**`
- Tests reference requirements: `**Validates: Requirements X.Y**`

### Integration Testing

**End-to-End Release:**
- Create test tag
- Verify build completes
- Verify artifacts uploaded to R2
- Verify /latest updated
- Verify cache invalidated

**Content Negotiation:**
- Test Worker with various Accept headers
- Verify correct format returned
- Verify correct Content-Type set

## Implementation Notes

### Technology Stack

**Build Tools:**
- Python 3.11+ with RDFLib
- pyLODE for HTML generation
- JSON-LD processors

**Cloudflare:**
- R2 for object storage
- Workers for content negotiation
- CDN for edge caching

**CI/CD:**
- GitHub Actions
- Wrangler CLI for Worker deployment

### Deployment Process

1. **Tag Creation**: Developer creates SemVer git tag
2. **CI Trigger**: GitHub Actions workflow starts
3. **Build**: Generate all formats and metadata
4. **Validate**: Run SHACL validation
5. **Upload**: Push artifacts to R2 with immutable keys
6. **Update**: Update /latest pointer
7. **Purge**: Invalidate CDN cache for /latest

### Worker Implementation

```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const accept = request.headers.get('Accept') || 'text/html';
    
    // Resolve /latest to current version
    let path = url.pathname;
    if (path.includes('/latest/')) {
      const latestVersion = await getLatestVersion(env);
      path = path.replace('/latest/', `/${latestVersion}/`);
    }
    
    // Content negotiation
    let format = 'html';
    if (accept.includes('text/turtle')) {
      format = 'ttl';
    } else if (accept.includes('application/ld+json')) {
      format = 'jsonld';
    }
    
    // Fetch from R2
    const objectKey = `${path}.${format}`;
    const object = await env.BUCKET.get(objectKey);
    
    if (!object) {
      return new Response('Not Found', { status: 404 });
    }
    
    return new Response(object.body, {
      headers: {
        'Content-Type': getContentType(format),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Vary': 'Accept'
      }
    });
  }
};
```

## Security Considerations

### Access Control

**Public Read Access:**
- All published artifacts publicly accessible
- No authentication required for GET requests
- Rate limiting at Cloudflare edge

**Admin Protection:**
- Admin paths protected via Cloudflare Access
- Require SSO for admin operations
- Audit log for admin actions

### Content Security

**Immutability:**
- Versioned paths never modified
- Prevents tampering
- Enables caching

**Integrity:**
- SHA-256 manifests for verification
- Signed releases (future)
- Provenance tracking

## Performance Considerations

### Edge Caching

**Cache Strategy:**
- Long TTLs for versioned paths (1 year)
- Short TTLs for /latest (1 hour)
- Vary on Accept header
- Purge on new release

**Compression:**
- Brotli for modern browsers
- Gzip fallback
- Pre-compress at build time

### Build Performance

**Optimization:**
- Parallel format generation
- Incremental builds (future)
- Cached dependencies

## Maintenance and Operations

### Release Process

1. Create git tag: `git tag v1.0.0`
2. Push tag: `git push origin v1.0.0`
3. CI builds and publishes automatically
4. Verify at: `https://ontology.example.com/latest/`

### Rollback Procedure

1. Update /latest pointer to previous version
2. Purge CDN cache
3. Verify rollback successful
4. Investigate issue with failed release

### Monitoring

**Key Metrics:**
- Request rate by version
- Cache hit ratio
- Error rate
- Response time

**Alerts:**
- Build failures
- Upload failures
- High error rate
- Cache miss rate spike

## Future Enhancements

### DOI Registration

**Zenodo Integration:**
- Automatic DOI registration per release
- Include DOI in CITATION.cff
- Link to Zenodo archive

### Enhanced Formats

**Additional Formats:**
- RDF/XML
- N-Triples
- N-Quads
- TriG

### Advanced Caching

**Smart Invalidation:**
- Selective cache purging
- Cache warming
- Predictive prefetching
