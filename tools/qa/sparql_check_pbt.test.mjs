import { test } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { execFile } from 'node:child_process';
import fc from 'fast-check';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const sparqlCheckScript = path.join(repoRoot, 'tools', 'sparql_check.mjs');

async function mkTemp(prefix = 'pbt-spq-') {
  return await fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

async function writeFileEnsured(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
}

function runSparqlCheck(baseDir, env = {}) {
  return new Promise(resolve => {
    execFile(process.execPath, [sparqlCheckScript, baseDir], { env, timeout: 20000 }, (error, stdout, stderr) => {
      resolve({
        code: error && typeof error.code === 'number' ? error.code : 0,
        stdout: stdout.toString(),
        stderr: stderr.toString()
      });
    });
  });
}

function makeInvalidQuery(seed) {
  // Start from a valid shape and remove a closing brace or a dot randomly using seed bits
  const varS = `?s${seed % 7}`;
  const varP = `?p${(seed >> 3) % 7}`;
  const varO = `?o${(seed >> 6) % 7}`;
  const base = `SELECT * WHERE { ${varS} ${varP} ${varO} . }`;
  return Math.random() > 0.5 ? base.replace('}', '') : base.replace('.', '');
}

function makeFormatDriftQuery(seed) {
  // Minimal valid query with suboptimal spacing/casing to trigger formatter drift
  const q = 'select * where{?s?p?o.}';
  // Randomly add inconsistent whitespace
  const spaces = ' '.repeat(seed % 3);
  return q.replace('?s', `${spaces}?s`).replace('?p', `${spaces}?p`);
}

test('Property: SPARQL parse errors produce non-zero exit and location', async () => {
  await fc.assert(
    fc.asyncProperty(fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }), async seed => {
      const tmp = await mkTemp();
      const qdir = path.join(tmp, 'queries');
      const f = path.join(qdir, `bad_${seed}.rq`);
      await writeFileEnsured(f, makeInvalidQuery(seed));
      const res = await runSparqlCheck(qdir, process.env);
      assert.equal(res.code, 1);
      assert.match(res.stderr, new RegExp(`${f.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}:\\d+:\\d+: error:`));
    }),
    { numRuns: 50 }
  );
});

test('Property: SPARQL formatting drift warns but passes when not enforced', async () => {
  await fc.assert(
    fc.asyncProperty(fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }), async seed => {
      const tmp = await mkTemp();
      const qdir = path.join(tmp, 'queries');
      const f = path.join(qdir, `fmt_${seed}.rq`);
      await writeFileEnsured(f, makeFormatDriftQuery(seed));
      const env = { ...process.env, ENFORCE_SPQ_FORMAT: '' };
      const res = await runSparqlCheck(qdir, env);
      assert.equal(res.code, 0);
      assert.match(res.stderr, /warning: formatting differs from canonical/i);
    }),
    { numRuns: 30 }
  );
});

test('Property: SPARQL formatting drift fails when enforcement is enabled', async () => {
  await fc.assert(
    fc.asyncProperty(fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }), async seed => {
      const tmp = await mkTemp();
      const qdir = path.join(tmp, 'queries');
      const f = path.join(qdir, `fmt_enf_${seed}.rq`);
      await writeFileEnsured(f, makeFormatDriftQuery(seed));
      const env = { ...process.env, ENFORCE_SPQ_FORMAT: 'true' };
      const res = await runSparqlCheck(qdir, env);
      assert.equal(res.code, 1);
      assert.match(res.stderr, /error: formatting differs from canonical/i);
    }),
    { numRuns: 30 }
  );
});

test('Property: No SPARQL files → passes with informative message', async () => {
  const tmp = await mkTemp();
  const qdir = path.join(tmp, 'queries'); // directory does not exist
  const res = await runSparqlCheck(qdir, process.env);
  assert.equal(res.code, 0);
  assert.match(res.stdout, /No SPARQL files found/);
});

test('Property: Nested directories with valid queries pass', async () => {
  const tmp = await mkTemp();
  const qdir = path.join(tmp, 'queries', 'nested');
  const files = ['a.rq', 'b.rq', 'c.rq'];
  await Promise.all(
    files.map((name, i) =>
      writeFileEnsured(path.join(qdir, name), `SELECT * WHERE { ?s ?p ?o . }  # ${i}`)
    )
  );
  const res = await runSparqlCheck(path.join(tmp, 'queries'), process.env);
  assert.equal(res.code, 0);
  assert.equal(res.stderr.trim(), '');
});


