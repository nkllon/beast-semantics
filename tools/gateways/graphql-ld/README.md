# GraphQL‑LD with Comunica (example)

GraphQL‑LD executes GraphQL‑like queries by translating them with a JSON‑LD context into SPARQL and running them via a Comunica query engine against your SPARQL endpoint.

## Prereqs
- Node.js 18+
- A SPARQL 1.1 endpoint URL in `SPARQL_ENDPOINT`

## Install (local dev)

```bash
npm i -D @comunica/query-sparql @graphql-ld/comunica graphql express
```

## Minimal server (example)

Create `server.mjs` (not committed here by default):

```js
import express from 'express';
import { QueryEngine } from '@comunica/query-sparql';
import { Client } from '@graphql-ld/comunica';

const app = express();
app.use(express.json());

const endpoint = process.env.SPARQL_ENDPOINT;
if (!endpoint) throw new Error('SPARQL_ENDPOINT is required');

const comunica = new QueryEngine();
const client = new Client({
  context: {
    "@vocab": "http://example.org/vocab#",
    "id": "@id",
    "label": "http://www.w3.org/2000/01/rdf-schema#label"
  },
  queryEngine: comunica,
  sources: [{ type: 'sparql', value: endpoint }]
});

app.post('/graphql', async (req, res) => {
  try {
    const { query, variables } = req.body;
    const result = await client.query({ query, variables });
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

const port = process.env.PORT || 8081;
app.listen(port, () => console.log(`GraphQL-LD server on :${port}`));
```

Run:

```bash
export SPARQL_ENDPOINT="http://localhost:7200/repositories/REPO_ID" # or Fuseki /query
node server.mjs
```

Query (POST http://localhost:8081/graphql):

```graphql
query {
  thing(id: "http://example.org/item/1") {
    id
    label
  }
}
```

## Notes
- GraphQL‑LD is client‑oriented; the Express server above is a thin wrapper to provide a familiar endpoint.
- For federation, add multiple sources to the Comunica engine configuration.
- Use a richer JSON‑LD context to align with your ontology terms.


