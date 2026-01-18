import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const hgqlReadme = path.join(repoRoot, 'tools', 'gateways', 'hypergraphql', 'README.md');
const gqlLdReadme = path.join(repoRoot, 'tools', 'gateways', 'graphql-ld', 'README.md');

test('Gateway docs mention env-driven configuration and auth guidance', () => {
	assert.equal(fs.existsSync(hgqlReadme), true);
	assert.equal(fs.existsSync(gqlLdReadme), true);
	const hgql = fs.readFileSync(hgqlReadme, 'utf-8');
	const gqlld = fs.readFileSync(gqlLdReadme, 'utf-8');
	// Env variable support
	assert.ok(/SPARQL_ENDPOINT/i.test(hgql) || /SPARQL_ENDPOINT/i.test(gqlld), 'Expected SPARQL_ENDPOINT env var documented');
	// Auth/credentials guidance present in at least one doc
	assert.ok(/auth|credential/i.test(hgql) || /auth|credential/i.test(gqlld), 'Expected auth/credential guidance in gateway docs');
});


