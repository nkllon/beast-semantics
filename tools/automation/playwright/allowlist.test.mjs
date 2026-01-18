import test from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';

import { isAllowedGithubUrl } from './allowlist.mjs';

test('Allowlist permits only GitHub settings/admin paths', () => {
	const allowed = [
		'https://github.com/settings/apps',
		'https://github.com/settings/apps/my-app',
		'https://github.com/organizations/my-org/settings/apps',
		'https://github.com/orgs/my-org/settings/apps',
	];
	for (const url of allowed) {
		assert.equal(isAllowedGithubUrl(url), true, `should allow ${url}`);
	}
	const denied = [
		'https://github.com/',
		'https://github.com/explore',
		'https://example.com/settings',
		'http://github.com/settings/apps', // non-https
	];
	for (const url of denied) {
		assert.equal(isAllowedGithubUrl(url), false, `should deny ${url}`);
	}
});

test('Property: only github.com settings paths match', () => {
	fc.assert(
		fc.property(fc.webUrl(), (url) => {
			const ok = isAllowedGithubUrl(url);
			if (ok) {
				assert.match(url, /^https:\/\/github\.com\/(orgs\/[^/]+\/)?settings\//);
			}
		}),
		{ numRuns: 100 }
	);
});





