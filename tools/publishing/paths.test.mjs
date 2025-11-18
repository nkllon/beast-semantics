import test from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { releasePathFromVersion } from './paths.mjs';

test('Property: Release path structure is /releases/Major.Minor.Patch/', async (t) => {
	await t.test('fast-check', () => {
		return fc.assert(
			fc.property(
				// Generate non-negative integers for semver parts
				fc.tuple(
					fc.nat({ max: 1_000_000 }),
					fc.nat({ max: 1_000_000 }),
					fc.nat({ max: 1_000_000 }),
				),
				([major, minor, patch]) => {
					const version = `${major}.${minor}.${patch}`;
					const path = releasePathFromVersion(version);
					assert.match(path, /^\\/releases\\/(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\/$/, 'path structure must match');
				},
			),
			{ numRuns: 100 },
		);
	});
});

test('Invalid versions are rejected', () => {
	const invalid = ['1.2', '1', 'a.b.c', '01.2.3', '1.02.3', '1.2.03', '1.2.3.4', '', '1..3'];
	for (const v of invalid) {
		assert.throws(() => releasePathFromVersion(v));
	}
});


