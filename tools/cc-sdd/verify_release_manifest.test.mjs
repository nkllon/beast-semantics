import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import os from 'node:os';
import fc from 'fast-check';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const verifyRelease = path.join(repoRoot, 'tools', 'verify-release.sh');
const releasesRoot = path.join(repoRoot, 'build', 'releases');

async function writeFileEnsured(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, data);
}

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function md5(buf) {
  return crypto.createHash('md5').update(buf).digest('hex');
}

async function createSnapshot(version, files) {
  const base = path.join(releasesRoot, version);
  for (const { relPath, data } of files) {
    await writeFileEnsured(path.join(base, relPath), data);
  }
  // Manifests
  let shaLines = '';
  let md5Lines = '';
  for (const { relPath, data } of files) {
    shaLines += `${sha256(data)}  ${relPath}\n`;
    md5Lines += `${md5(data)}  ${relPath}\n`;
  }
  await writeFileEnsured(path.join(base, 'MANIFEST.sha256'), shaLines);
  await writeFileEnsured(path.join(base, 'MANIFEST.md5'), md5Lines);
  return base;
}

function runVerify(version) {
  return new Promise(resolve => {
    execFile(verifyRelease, [version], { timeout: 20000 }, (error, stdout, stderr) => {
      resolve({
        code: error && typeof error.code === 'number' ? error.code : 0,
        stdout: stdout.toString(),
        stderr: stderr.toString()
      });
    });
  });
}

test('Property: Release manifest integrity holds for random file sets', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-'), { minLength: 8, maxLength: 16 }),
      fc.array(
        fc.record({
          relPath: fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789/_-'), { minLength: 3, maxLength: 24 }).filter(p => !p.startsWith('.') && !p.includes('..') && !p.endsWith('/')),
          data: fc.uint8Array({ maxLength: 2048 })
        }),
        { minLength: 1, maxLength: 5 }
      ),
      async (suffix, entries) => {
        const version = `pbt-${Date.now()}-${process.pid}-${suffix}`;
        const files = entries.map(e => ({ relPath: e.relPath, data: Buffer.from(e.data) }));
        const base = await createSnapshot(version, files);
        try {
          const ok = await runVerify(version);
          assert.equal(ok.code, 0, `Expected success for intact snapshot (${version})`);
          assert.match(ok.stdout, /Release verification PASSED/);
        } finally {
          await fs.rm(path.join(releasesRoot, version), { recursive: true, force: true });
        }
      }
    ),
    { numRuns: 100 }
  );
});

test('Property: Release verification fails on tampering', async () => {
  const version = `pbt-tamper-${Date.now()}-${process.pid}`;
  const files = [
    { relPath: 'a.txt', data: Buffer.from('alpha') },
    { relPath: 'dir/b.bin', data: crypto.randomBytes(64) }
  ];
  const base = await createSnapshot(version, files);
  try {
    // First verify passes
    const first = await runVerify(version);
    assert.equal(first.code, 0);
    // Tamper with a file
    await fs.writeFile(path.join(base, 'a.txt'), Buffer.from('alpha!'));
    const res = await runVerify(version);
    assert.equal(res.code, 1, 'Expected non-zero exit after tampering');
    assert.match(res.stdout + res.stderr, /(MISMATCH|FAILED)/i);
  } finally {
    await fs.rm(path.join(releasesRoot, version), { recursive: true, force: true });
  }
});


