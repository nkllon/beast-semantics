import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';

const endpoint = process.env.SPARQL_ENDPOINT;

test('Property: SPARQL endpoint connectivity', async (t) => {
	if (!endpoint) {
		t.skip('SPARQL_ENDPOINT not set; skipping connectivity property');
		return;
	}
	await fc.assert(
		fc.asyncProperty(fc.integer({ min: 1, max: 3 }), async () => {
			const ask = 'ASK { ?s ?p ?o }';
			const res = await fetch(endpoint, {
				method: 'POST',
				headers: { 'content-type': 'application/sparql-query', accept: 'application/sparql-results+json' },
				body: ask
			});
			assert.equal(res.ok, true, `endpoint responded with ${res.status}`);
			const json = await res.json();
			assert.ok(typeof json.boolean === 'boolean');
		}),
		{ numRuns: 5 }
	);
});


