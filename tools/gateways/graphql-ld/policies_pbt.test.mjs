import test from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';

import { requireAuth, enforceDepth, cacheKeyForPersistedQuery } from './policies.mjs';

test('Authentication is required unless explicit allowPublic is true', () => {
	// Missing auth → throws
	assert.throws(() => requireAuth({ headers: {} }), /unauthorized/i);
	// With bearer token → ok
	assert.doesNotThrow(() => requireAuth({ headers: { authorization: 'Bearer abc' } }));
	// With CF-Access-Jwt-Assertion → ok
	assert.doesNotThrow(() => requireAuth({ headers: { 'cf-access-jwt-assertion': 'xyz' } }));
	// Public allow override
	assert.doesNotThrow(() => requireAuth({ headers: {} }, { allowPublic: true }));
});

test('GraphQL depth enforcement rejects queries exceeding limit', () => {
	const shallow = '{ a { b } }';  // depth 2
	const deep = '{ a { b { c { d } } } }'; // depth 4
	assert.equal(enforceDepth(shallow, 3), true);
	assert.equal(enforceDepth(deep, 3), false);
});

test('Property: cache key for persisted queries includes id and user context', () => {
	fc.assert(
		fc.property(
			fc.hexaString({ minLength: 8, maxLength: 64 }),
			fc.boolean(),
			(id, isAdmin) => {
				const key1 = cacheKeyForPersistedQuery(id, { sub: 'user1', isAdmin });
				const key2 = cacheKeyForPersistedQuery(id, { sub: 'user2', isAdmin });
				assert.notEqual(key1, key2, 'different users must produce different cache keys');
				assert.match(key1, /^persisted:/);
			}
		),
		{ numRuns: 50 }
	);
});





