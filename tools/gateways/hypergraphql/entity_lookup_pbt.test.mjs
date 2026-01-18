import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';

const endpoint = process.env.SPARQL_ENDPOINT;
const testEntityIri = process.env.TEST_ENTITY_IRI; // optional

test('Property: Entity lookup by IRI (responds and returns valid result set)', async (t) => {
	if (!endpoint || !testEntityIri) {
		t.skip('SPARQL_ENDPOINT or TEST_ENTITY_IRI not set; skipping entity lookup property');
		return;
	}
	await fc.assert(
		fc.asyncProperty(fc.constantFrom('rdfs:label', 'rdf:type'), async (prop) => {
			const prefixes = `
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
`;
			const q = `${prefixes}
SELECT * WHERE { <${testEntityIri}> ?p ?o } LIMIT 10`;
			const res = await fetch(endpoint, {
				method: 'POST',
				headers: { 'content-type': 'application/sparql-query', accept: 'application/sparql-results+json' },
				body: q
			});
			assert.equal(res.ok, true, `endpoint responded with ${res.status}`);
			const json = await res.json();
			assert.ok(Array.isArray(json.head?.vars));
			assert.ok(Array.isArray(json.results?.bindings));
		}),
		{ numRuns: 5 }
	);
});


