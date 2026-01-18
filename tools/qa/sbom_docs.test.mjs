import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const readmePath = path.join(repoRoot, 'README.md');

test('README documents CycloneDX SBOM generation approach', async () => {
	const text = await fs.readFile(readmePath, 'utf8');
	assert.match(text, /CycloneDX/i);
	assert.match(text, /sbom\.cdx\.json/i);
});


