import { test } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const verifyScript = path.join(repoRoot, 'tools', 'verify-cc-sdd.sh');

async function makeTmpDir(prefix = 'pbt-idem-') {
  return await fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

async function scaffold(cwd) {
  // Create minimal required structure/files so verification can pass
  const commands = [
    'spec-design.md',
    'spec-impl.md',
    'spec-init.md',
    'spec-requirements.md',
    'spec-status.md',
    'spec-tasks.md',
    'steering-custom.md',
    'steering.md',
    'validate-design.md',
    'validate-gap.md',
    'validate-impl.md'
  ];
  await fs.mkdir(path.join(cwd, '.cursor', 'commands', 'kiro'), { recursive: true });
  await Promise.all(commands.map(f => fs.writeFile(path.join(cwd, '.cursor', 'commands', 'kiro', f), '# ok\n')));
  await fs.mkdir(path.join(cwd, '.kiro', 'settings', 'rules'), { recursive: true });
  await fs.mkdir(path.join(cwd, '.kiro', 'settings', 'templates', 'specs'), { recursive: true });
  await fs.mkdir(path.join(cwd, '.kiro', 'settings', 'templates', 'steering'), { recursive: true });
  await fs.mkdir(path.join(cwd, '.kiro', 'settings', 'templates', 'steering-custom'), { recursive: true });
  await fs.writeFile(path.join(cwd, 'AGENTS.md'), '# ok\n');
}

async function writeMockNode(binDir) {
  const p = path.join(binDir, 'node');
  await fs.writeFile(p, `#!/usr/bin/env bash
echo "v18.19.0"
`, { mode: 0o755 });
  return p;
}

function runVerify(cwd, env) {
  return new Promise(resolve => {
    execFile(verifyScript, { cwd, env, timeout: 15000 }, (error, stdout, stderr) => {
      resolve({
        code: error && typeof error.code === 'number' ? error.code : 0,
        stdout: stdout.toString(),
        stderr: stderr.toString()
      });
    });
  });
}

test('Property: Verification is idempotent (same result across runs)', async () => {
  const tmp = await makeTmpDir();
  await scaffold(tmp);
  const bin = path.join(tmp, 'bin');
  await fs.mkdir(bin);
  await writeMockNode(bin);
  const env = { ...process.env, PATH: `${bin}:${process.env.PATH ?? ''}` };

  const r1 = await runVerify(tmp, env);
  const r2 = await runVerify(tmp, env);

  assert.equal(r1.code, 0, 'First run should pass');
  assert.equal(r2.code, 0, 'Second run should pass');
  assert.equal(r1.stdout, r2.stdout, 'Outputs should be identical between runs');
});


