import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const workflowPath = path.join(repoRoot, '.github', 'workflows', 'ci.yml');

test('CI workflow includes RIOT, rdflint, gitleaks, and pip-audit steps', async () => {
	assert.equal(fs.existsSync(workflowPath), true, 'Expected .github/workflows/ci.yml to exist');
	const content = fs.readFileSync(workflowPath, 'utf-8');
	// Jena RIOT validation present
	assert.ok(/riot\s+--validate/i.test(content), 'Expected RIOT validation step');
	// rdflint present (download or run)
	assert.ok(/rdflint/i.test(content) && (/java\s+-jar\s+rdflint\.jar/i.test(content) || /rdflint-all-\d+\.\d+\.\d+\.jar/i.test(content)), 'Expected rdflint step');
	// gitleaks action present
	assert.match(content, /gitleaks\/gitleaks-action@v2/i, 'Expected gitleaks action');
	// pip-audit present
	assert.ok(/pip-audit/.test(content), 'Expected pip-audit step');
});


