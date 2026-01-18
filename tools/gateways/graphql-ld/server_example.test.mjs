import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const serverPath = path.join(repoRoot, 'tools', 'gateways', 'graphql-ld', 'server.mjs');
const contextPath = path.join(repoRoot, 'tools', 'gateways', 'graphql-ld', 'context.json');

async function runServer() {
	return new Promise((resolve, reject) => {
		const child = spawn(process.execPath, [serverPath], {
			env: { ...process.env, PORT: '0' },
			stdio: ['ignore', 'pipe', 'pipe']
		});
		let buf = '';
		let exited = false;
		child.stdout.on('data', d => {
			buf += d.toString();
			const m = buf.match(/Listening on (\d+)/);
			if (m) {
				resolve({ child, port: Number(m[1]) });
			}
		});
		child.on('exit', (code) => {
			if (!exited) {
				exited = true;
				reject(new Error(`server exited early with code ${code}`));
			}
		});
	});
}

async function fetchJson(url) {
	const res = await fetch(url, { headers: { accept: 'application/json' } });
	return { ok: res.ok, status: res.status, json: await res.json() };
}

test('GraphQL-LD example server: starts, /health ok, /context served', async (t) => {
	const { child, port } = await runServer();
	try {
		const base = `http://127.0.0.1:${port}`;
		{
			const res = await fetchJson(`${base}/health`);
			assert.equal(res.ok, true);
			assert.equal(res.status, 200);
			assert.equal(res.json.ok, true);
			assert.match(res.json.node, /^v\d+\.\d+\.\d+/);
		}
		{
			const res = await fetchJson(`${base}/context`);
			assert.equal(res.ok, true);
			assert.equal(res.status, 200);
			assert.ok(res.json['@context']);
		}
	} finally {
		child.kill();
	}
});


