# HyperGraphQL (template)

This directory contains a minimal HyperGraphQL configuration that maps a GraphQL schema to an external SPARQL 1.1 endpoint (GraphDB or Fuseki).

## Prereqs
- Docker Desktop running (or Java if running the JAR directly)
- An existing SPARQL endpoint URL in `SPARQL_ENDPOINT` (e.g., `https://localhost:7200/repositories/REPO_ID` for GraphDB, or `http://localhost:3030/ds/query` for Fuseki)

## Files
- `config.json`: gateway configuration; points to `${SPARQL_ENDPOINT}`
- `schema.graphql`: minimal schema with `Thing` exposing `id` and `rdfs:label`

## Run (container example)
Use the official HyperGraphQL container (refer to vendor docs for the latest image name/version):

```bash
export SPARQL_ENDPOINT="http://localhost:3030/ds/query"
# Or for GraphDB:
# export SPARQL_ENDPOINT="http://localhost:7200/repositories/REPO_ID"

docker run --rm -p 8080:8080 \
  -e SPARQL_ENDPOINT="$SPARQL_ENDPOINT" \
  -v "$(pwd)/tools/gateways/hypergraphql:/app/config" \
  ghcr.io/hypergraphql/hypergraphql:latest \
  --config /app/config/config.json
```

Then open `http://localhost:8080/graphql` and run:

```graphql
query {
  things(limit: 5) {
    id
    label
  }
}
```

## Notes
- Mutations are not enabled in this template; add SPARQL Update mappings if needed.
- For Fuseki updates, point to the `/update` endpoint in a second service block and extend the schema accordingly.
- For secured endpoints, inject auth headers via container env/flags per HyperGraphQL docs.


