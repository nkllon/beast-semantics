import { test } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { execFile } from 'node:child_process';

async function mkTmp(prefix = 'reuse-idx-') {
	return await fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

async function writeIndex(dir) {
	const index = {
		version: 1,
		created_at: new Date().toISOString(),
		root_path: dir,
		idf: { a: 1, b: 1 },
		docs: [
			{ path: 'doc1.txt', vector: [['a', 1]] },
			{ path: 'doc2.txt', vector: [['b', 1]] }
		]
	};
	const p = path.join(dir, 'index.json');
	await fs.writeFile(p, JSON.stringify(index), 'utf8');
	return p;
}

function runCmd(cmd, args, env = {}) {
	return new Promise(resolve => {
		execFile(process.execPath, args[0].endsWith('.mjs') ? [args[0], ...args.slice(1)] : args, { env: { ...process.env, ...env }, timeout: 10000 }, (error, stdout, stderr) => {
			resolve({
				code: error && typeof error.code === 'number' ? error.code : 0,
				stdout: stdout.toString(),
				stderr: stderr.toString()
			});
		});
	});
}

test('reuse_query supports --alpha override and prints s_hyb reflecting alpha', async () => {
	const tmp = await mkTmp();
	const idx = await writeIndex(tmp);
	const script = path.resolve('tools/reuse_query.mjs');
	const r0 = await runCmd('node', [script, '--index', idx, '--query', 'a', '--k', '1', '--alpha', '0.0']);
	assert.equal(r0.code, 0);
	const line = r0.stdout.trim().split('\n')[0];
	const [s_hyb] = line.split('\t').map(Number);
	assert.equal(Number.isFinite(s_hyb), true);
	assert.equal(s_hyb, 0, 'alpha=0 implies s_hyb==s_den==0');
});

test('reuse_evidence passes --alpha override through to evidence JSON', async () => {
	const tmp = await mkTmp();
	const idx = await writeIndex(tmp);
	const out = path.join(tmp, 'ev.json');
	const script = path.resolve('tools/reuse_evidence.mjs');
	const r = await runCmd('node', [script, '--index', idx, '--query', 'a', '--k', '1', '--out', out, '--alpha', '0.25']);
	assert.equal(r.code, 0);
	const ev = JSON.parse(await fs.readFile(out, 'utf8'));
	assert.equal(ev.alpha, 0.25);
});


