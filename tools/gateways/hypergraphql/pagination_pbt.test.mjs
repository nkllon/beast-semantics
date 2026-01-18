import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';

const endpoint = process.env.SPARQL_ENDPOINT;

test('Property: Pagination consistency (no overlap across pages with ORDER BY)', async (t) => {
	if (!endpoint) {
		t.skip('SPARQL_ENDPOINT not set; skipping pagination property');
		return;
	}
	await fc.assert(
		fc.asyncProperty(fc.integer({ min: 5, max: 50 }), async (pageSize) => {
			const base = `
SELECT ?s ?p ?o WHERE { ?s ?p ?o } ORDER BY ?s ?p ?o
`;
			const q1 = `${base}\nLIMIT ${pageSize} OFFSET 0`;
			const q2 = `${base}\nLIMIT ${pageSize} OFFSET ${pageSize}`;
			const fetchQ = async (q) => {
				const res = await fetch(endpoint, {
					method: 'POST',
					headers: { 'content-type': 'application/sparql-query', accept: 'application/sparql-results+json' },
					body: q
				});
				assert.equal(res.ok, true, `endpoint responded with ${res.status}`);
				return await res.json();
			};
			const [r1, r2] = await Promise.all([fetchQ(q1), fetchQ(q2)]);
			const key = (b) => `${b.s?.value ?? ''}|${b.p?.value ?? ''}|${b.o?.value ?? ''}`;
			const set1 = new Set(r1.results?.bindings.map(key) ?? []);
			const set2 = new Set(r2.results?.bindings.map(key) ?? []);
			let overlap = false;
			for (const v of set1) {
				if (set2.has(v)) {
					overlap = true;
					break;
				}
			}
			assert.equal(overlap, false);
		}),
		{ numRuns: 3 }
	);
});


