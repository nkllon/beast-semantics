import { test } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fc from 'fast-check';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const verifyScript = path.join(repoRoot, 'tools', 'verify-cc-sdd.sh');

async function makeTmpDir(prefix = 'pbt-ccsdd-') {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  return tmp;
}

async function writeExecutable(filePath, content) {
  await fs.writeFile(filePath, content, { mode: 0o755 });
}

async function scaffoldMinimalRepoState(cwd) {
  // Commands
  const commandsDir = path.join(cwd, '.cursor', 'commands', 'kiro');
  await fs.mkdir(commandsDir, { recursive: true });
  const expected = [
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
  await Promise.all(expected.map(f => fs.writeFile(path.join(commandsDir, f), '# placeholder\n')));
  // Settings
  const settingsSubdirs = [
    path.join('.kiro', 'settings', 'rules'),
    path.join('.kiro', 'settings', 'templates', 'specs'),
    path.join('.kiro', 'settings', 'templates', 'steering'),
    path.join('.kiro', 'settings', 'templates', 'steering-custom')
  ];
  await Promise.all(settingsSubdirs.map(d => fs.mkdir(path.join(cwd, d), { recursive: true })));
  // AGENTS.md
  await fs.writeFile(path.join(cwd, 'AGENTS.md'), '# Agents\n');
}

function runVerifyWithEnv(cwd, env) {
  return new Promise(resolve => {
    const child = execFile(verifyScript, { cwd, env, timeout: 15000 }, (error, stdout, stderr) => {
      resolve({
        code: error && typeof error.code === 'number' ? error.code : 0,
        stdout: stdout.toString(),
        stderr: stderr.toString()
      });
    });
    // Inherit nothing from stdio
    void child;
  });
}

test('Property: Node version enforcement (fails for <18)', async () => {
  await fc.assert(
    fc.asyncProperty(fc.integer({ min: 8, max: 17 }), async major => {
      const tmp = await makeTmpDir();
      await scaffoldMinimalRepoState(tmp);

      // Mock "node" to output v<major>.0.0
      const mockBin = path.join(tmp, 'bin');
      await fs.mkdir(mockBin);
      const mockNodePath = path.join(mockBin, 'node');
      await writeExecutable(mockNodePath, `#!/usr/bin/env bash
echo "v${major}.0.0"
`);

      const env = {
        ...process.env,
        PATH: `${mockBin}:${process.env.PATH ?? ''}`
      };

      const res = await runVerifyWithEnv(tmp, env);
      assert.equal(res.code, 1, `Expected non-zero exit for Node<18 (got ${res.code})`);
      assert.match(res.stdout + res.stderr, /Node\.js 18\+ required/i);
    }),
    { numRuns: 100 }
  );
});

test('Property: Node version enforcement (passes for >=18)', async () => {
  await fc.assert(
    fc.asyncProperty(fc.integer({ min: 18, max: 28 }), async major => {
      const tmp = await makeTmpDir();
      await scaffoldMinimalRepoState(tmp);

      // Mock "node" to output v<major>.2.3
      const mockBin = path.join(tmp, 'bin');
      await fs.mkdir(mockBin);
      const mockNodePath = path.join(mockBin, 'node');
      await writeExecutable(mockNodePath, `#!/usr/bin/env bash
echo "v${major}.2.3"
`);

      const env = {
        ...process.env,
        PATH: `${mockBin}:${process.env.PATH ?? ''}`
      };

      const res = await runVerifyWithEnv(tmp, env);
      assert.equal(res.code, 0, `Expected zero exit for Node>=18 (got ${res.code})`);
      assert.match(res.stdout, /Verification PASSED/);
    }),
    { numRuns: 100 }
  );
});


