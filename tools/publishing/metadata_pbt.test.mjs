import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const script = path.join(repoRoot, 'tools', 'generate_metadata.py');
const inputTtl = path.join(repoRoot, 'build', 'words-v1.ttl');
const outFile = path.join(repoRoot, 'build', 'metadata', 'void.ttl');

function runScript() {
	return new Promise(resolve => {
		execFile('python3', [script, '--in', inputTtl, '--out', outFile], { timeout: 20000 }, (error, stdout, stderr) => {
			resolve({
				code: error && typeof error.code === 'number' ? error.code : 0,
				stdout: stdout.toString(),
				stderr: stderr.toString()
			});
		});
	});
}

function hasRdflib() {
	return new Promise(resolve => {
		execFile('python3', ['-c', 'import rdflib'], { timeout: 5000 }, (error) => {
			resolve(!error);
		});
	});
}

test('Release metadata completeness: generates VoID/DCAT with stats and provenance', async (t) => {
	if (!(await hasRdflib())) {
		t.skip('rdflib not installed; skipping metadata completeness test');
		return;
	}
	const res = await runScript();
	assert.equal(res.code, 0, `metadata generator should succeed (${res.stderr})`);
	const data = await fs.readFile(outFile, 'utf-8');
	// Minimal shape assertions
	assert.match(data, /void:Dataset/);
	assert.match(data, /dcat:Dataset/);
	assert.match(data, /void:triples/);
	assert.match(data, /void:classes/);
	assert.match(data, /void:properties/);
	assert.match(data, /void:entities/);
	assert.match(data, /dcterms:issued/);
});


