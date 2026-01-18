import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const configPath = path.join(repoRoot, 'tools', 'gateways', 'hypergraphql', 'config.json');
const readmePath = path.join(repoRoot, 'tools', 'gateways', 'hypergraphql', 'README.md');

test('HyperGraphQL config uses ${SPARQL_ENDPOINT} and docs mention GraphDB and Fuseki', () => {
	assert.equal(fs.existsSync(configPath), true);
	assert.equal(fs.existsSync(readmePath), true);
	const cfg = fs.readFileSync(configPath, 'utf-8');
	const readme = fs.readFileSync(readmePath, 'utf-8');
	assert.match(cfg, /\$\{SPARQL_ENDPOINT\}/, 'Expected ${SPARQL_ENDPOINT} in config');
	assert.match(readme, /GraphDB/i, 'Expected GraphDB documented');
	assert.match(readme, /Fuseki/i, 'Expected Fuseki documented');
});


