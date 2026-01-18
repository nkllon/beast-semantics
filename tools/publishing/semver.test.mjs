import test from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { isStrictSemVer } from './semver.mjs';

test('isStrictSemVer accepts only Major.Minor.Patch with no pre-release/build', async (t) => {
	await t.test('accepts numeric x.y.z', () => {
		const valid = ['0.0.0', '1.2.3', '10.0.7', '999999.123456.0'];
		for (const v of valid) {
			assert.equal(isStrictSemVer(v), true, `expected valid: ${v}`);
		}
	});

	await t.test('rejects non-strict variants', () => {
		const invalid = [
			'1', '1.2', 'a.b.c', '', '1.2.3.4',
			'01.2.3', '1.02.3', '1.2.03',
			'1.2.3-alpha', '1.2.3+build', '1.2.3-alpha+build',
			' v1.2.3 ', '1.2.-1', '-1.0.0'
		];
		for (const v of invalid) {
			assert.equal(isStrictSemVer(v), false, `expected invalid: ${v}`);
		}
	});

	await t.test('property: numeric triplets are valid, others are not', () => {
		return fc.assert(
			fc.property(
				fc.tuple(fc.nat({ max: 1_000_000 }), fc.nat({ max: 1_000_000 }), fc.nat({ max: 1_000_000 })),
				([major, minor, patch]) => {
					const v = `${major}.${minor}.${patch}`;
					assert.equal(isStrictSemVer(v), true);
				}
			),
			{ numRuns: 100 }
		);
	});
});


