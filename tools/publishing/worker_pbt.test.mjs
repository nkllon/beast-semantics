import test from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';

// Under test: to be implemented
import { workerFetch } from './worker.mjs';

function makeRequest(url, acceptHeader) {
	return new Request(url, { headers: acceptHeader ? { Accept: acceptHeader } : {} });
}

test('Property: content negotiation selects ttl/jsonld/html based on Accept', async () => {
	await fc.assert(
		fc.asyncProperty(
			fc.constantFrom('text/turtle', 'application/ld+json', 'text/html', '*/*', ''),
			async (accept) => {
				const req = makeRequest('https://example.org/words/latest/ontology', accept);
				const env = {
					// Minimal BUCKET stub that returns a body reflecting the resolved extension
					BUCKET: {
						async get(key) {
							// Expect keys to end with one of the known extensions
							if (key.endsWith('.ttl')) return { body: 'ttl' };
							if (key.endsWith('.jsonld')) return { body: 'jsonld' };
							if (key.endsWith('.html')) return { body: 'html' };
							return null;
						}
					},
					// Latest resolver
					async getLatestVersion() {
						return '1.2.3';
					}
				};
				const res = await workerFetch(req, env);
				assert.equal(res.status, 200);
				const ct = res.headers.get('Content-Type');
				const body = await res.text();
				if (accept.includes('text/turtle')) {
					assert.equal(ct, 'text/turtle');
					assert.equal(body, 'ttl');
				} else if (accept.includes('application/ld+json')) {
					assert.equal(ct, 'application/ld+json');
					assert.equal(body, 'jsonld');
				} else {
					assert.equal(ct, 'text/html');
					assert.equal(body, 'html');
				}
			}
		),
		{ numRuns: 50 }
	);
});

test('Worker sets long Cache-Control and Vary: Accept', async () => {
	const req = makeRequest('https://example.org/words/1.0.0/ontology', 'text/turtle');
	const env = {
		BUCKET: { async get() { return { body: 'ttl' }; } },
		async getLatestVersion() { return '1.0.0'; }
	};
	const res = await workerFetch(req, env);
	assert.equal(res.status, 200);
	assert.match(res.headers.get('Cache-Control'), /max-age=31536000/);
	assert.equal(res.headers.get('Vary'), 'Accept');
});





