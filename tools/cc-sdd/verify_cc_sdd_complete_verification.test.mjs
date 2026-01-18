import { test } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { execFile } from 'node:child_process';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const verifyScript = path.join(repoRoot, 'tools', 'verify-cc-sdd.sh');

const expectedFiles = [
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

async function mkTemp(prefix) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  return dir;
}

async function writeMockNode(cwd) {
  const bin = path.join(cwd, 'bin');
  await fs.mkdir(bin);
  await fs.writeFile(path.join(bin, 'node'), `#!/usr/bin/env bash
echo "v18.0.0"
`, { mode: 0o755 });
  return bin;
}

async function scaffold(cwd, presentFlags) {
  // settings + agents always present
  await fs.mkdir(path.join(cwd, '.kiro', 'settings', 'rules'), { recursive: true });
  await fs.mkdir(path.join(cwd, '.kiro', 'settings', 'templates', 'specs'), { recursive: true });
  await fs.mkdir(path.join(cwd, '.kiro', 'settings', 'templates', 'steering'), { recursive: true });
  await fs.mkdir(path.join(cwd, '.kiro', 'settings', 'templates', 'steering-custom'), { recursive: true });
  await fs.writeFile(path.join(cwd, 'AGENTS.md'), '# ok\n');

  const dir = path.join(cwd, '.cursor', 'commands', 'kiro');
  await fs.mkdir(dir, { recursive: true });
  for (let i = 0; i < expectedFiles.length; i++) {
    if (presentFlags[i]) {
      await fs.writeFile(path.join(dir, expectedFiles[i]), '# ok\n');
    }
  }
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

test('Property: Complete file verification — passes iff all expected files exist', async () => {
  // Deterministic set: should pass when all present
  {
    const cwd = await mkTemp('pbt-complete-');
    const bin = await writeMockNode(cwd);
    await scaffold(cwd, expectedFiles.map(() => true));
    const env = { ...process.env, PATH: `${bin}:${process.env.PATH ?? ''}` };
    const res = await runVerify(cwd, env);
    assert.equal(res.code, 0);
  }
  // Random subsets (with at least one missing) should fail
  for (let i = 0; i < 20; i++) {
    const flags = expectedFiles.map(() => Math.random() > 0.2);
    // Ensure at least one missing
    if (flags.every(Boolean)) flags[0] = false;
    const cwd = await mkTemp('pbt-incomplete-');
    const bin = await writeMockNode(cwd);
    await scaffold(cwd, flags);
    const env = { ...process.env, PATH: `${bin}:${process.env.PATH ?? ''}` };
    const res = await runVerify(cwd, env);
    assert.equal(res.code, 1, 'Verification should fail when files are missing');
  }
});


