import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';

const endpoint = process.env.SPARQL_ENDPOINT;

test('Property: Property traversal completeness (two-hop traversal executes)', async (t) => {
	if (!endpoint) {
		t.skip('SPARQL_ENDPOINT not set; skipping traversal property');
		return;
	}
	await fc.assert(
		fc.asyncProperty(fc.integer({ min: 1, max: 3 }), async () => {
			const q = `
SELECT ?s ?p ?o ?p2 ?o2 WHERE {
  ?s ?p ?o .
  OPTIONAL { ?o ?p2 ?o2 }
} LIMIT 25
`;
			const res = await fetch(endpoint, {
				method: 'POST',
				headers: { 'content-type': 'application/sparql-query', accept: 'application/sparql-results+json' },
				body: q
			});
			assert.equal(res.ok, true, `endpoint responded with ${res.status}`);
			const json = await res.json();
			assert.ok(Array.isArray(json.results?.bindings));
		}),
		{ numRuns: 5 }
	);
});


