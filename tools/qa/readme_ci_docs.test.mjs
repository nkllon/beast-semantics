import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const readmePath = path.join(repoRoot, 'README.md');

test('README documents CI gates and remediation', async () => {
	assert.equal(fs.existsSync(readmePath), true, 'Expected README.md to exist');
	const content = fs.readFileSync(readmePath, 'utf-8');
	assert.match(content, /## CI Gates/i, 'Expected CI Gates section');
	assert.match(content, /riot\s+--validate/i, 'Expected RIOT mention');
	assert.match(content, /rdflint/i, 'Expected rdflint mention');
	assert.match(content, /sparql_check\.mjs/i, 'Expected SPARQL checker mention');
	assert.match(content, /gitleaks/i, 'Expected gitleaks mention');
	assert.match(content, /pip-audit/i, 'Expected pip-audit mention');
	assert.match(content, /Remediation/i, 'Expected remediation guidance');
});


