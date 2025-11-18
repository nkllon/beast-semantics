import { test } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { execFile } from 'node:child_process';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const validateScript = path.join(repoRoot, 'tools', 'validate_rdf.py');

async function mkTemp(prefix = 'pbt-rdf-') {
  return await fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

async function writeFileEnsured(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
}

function runValidate(cwd) {
  return new Promise(resolve => {
    execFile('python3', [validateScript], { cwd, timeout: 20000 }, (error, stdout, stderr) => {
      resolve({
        code: error && typeof error.code === 'number' ? error.code : 0,
        stdout: stdout.toString(),
        stderr: stderr.toString()
      });
    });
  });
}

test('Property: Valid TTL passes; invalid TTL fails', async () => {
  {
    const tmp = await mkTemp();
    const f = path.join(tmp, 'ontology', 'ok.ttl');
    await writeFileEnsured(
      f,
      '@prefix ex: <http://example.com/> .\nex:a ex:p ex:b .\n'
    );
    const res = await runValidate(tmp);
    assert.equal(res.code, 0);
    assert.match(res.stdout, /Validation passed/i);
  }
  {
    const tmp = await mkTemp();
    const f = path.join(tmp, 'ontology', 'bad.ttl');
    // Missing trailing dot
    await writeFileEnsured(
      f,
      '@prefix ex: <http://example.com/> .\nex:a ex:p ex:b \n'
    );
    const res = await runValidate(tmp);
    assert.equal(res.code, 1);
    assert.match(res.stderr, /Validation failed/i);
  }
});

test('Property: No RDF files found returns success with informative message', async () => {
  const tmp = await mkTemp();
  const res = await runValidate(tmp);
  assert.equal(res.code, 0);
  assert.match(res.stdout, /No RDF files found/i);
});


