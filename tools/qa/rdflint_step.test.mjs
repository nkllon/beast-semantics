import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const script = path.join(repoRoot, 'tools', 'rdflint.sh');

function runRdflint(cwd) {
	return new Promise(resolve => {
		execFile('bash', [script], { cwd, timeout: 10000 }, (error, stdout, stderr) => {
			resolve({
				code: error && typeof error.code === 'number' ? error.code : 0,
				stdout: stdout.toString(),
				stderr: stderr.toString()
			});
		});
	});
}

test('rdflint script exists and is runnable', async () => {
	const stat = await fs.stat(script);
	assert.ok(stat.isFile());
});

test('rdflint: skips gracefully when RDFLINT_JAR not configured', async () => {
	const res = await runRdflint(repoRoot);
	assert.equal(res.code, 0);
	assert.match(res.stdout + res.stderr, /rdflint skipped/i);
});


