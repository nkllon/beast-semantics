import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const workflowPath = path.join(repoRoot, '.github', 'workflows', 'ci.yml');

test('CI workflow exists and includes SPARQL checker step', async () => {
	assert.equal(fs.existsSync(workflowPath), true, 'Expected .github/workflows/ci.yml to exist');
	const content = fs.readFileSync(workflowPath, 'utf-8');
	assert.match(content, /actions\/setup-node@/i, 'Expected Node setup step');
	// Accept either npm script invocation or direct node invocation
	assert.ok(
		/npm run (?:-s )?check:sparql/i.test(content) ||
		/node\s+tools\/sparql_check\.mjs\s+queries/i.test(content),
		'Expected SPARQL checker to run (via npm or direct node)'
	);
});


