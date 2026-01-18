import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const policyPath = path.resolve('.kiro/steering/policy.reuse.yml');

test('Reuse policy contains required keys', async () => {
	const text = await fs.readFile(policyPath, 'utf8');
	const required = ['version', 'owner', 'k', 'alpha', 'tau', 'delta', 'recency_days', 'cve_threshold', 'weights', 'seed'];
	for (const key of required) {
		assert.match(text, new RegExp(`\\b${key}\\b`), `policy missing key: ${key}`);
	}
});


