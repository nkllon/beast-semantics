import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const script = path.join(repoRoot, 'tools', 'publishing', 'formats.py');

test('formats.py exists', async () => {
  const st = await fs.stat(script);
  assert.ok(st.isFile());
});

function runScript() {
  return new Promise(resolve => {
    execFile('python3', [script], { timeout: 15000 }, (error, stdout, stderr) => {
      resolve({
        code: error && typeof error.code === 'number' ? error.code : 0,
        stdout: stdout.toString(),
        stderr: stderr.toString()
      });
    });
  });
}

test('formats.py skips when rdflib/pyLODE is not available', async () => {
  const res = await runScript();
  assert.equal(res.code, 0);
  assert.match(res.stdout + res.stderr, /formats skipped/i);
});


