import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

test('developer-environment-docker-desktop tasks use checkbox formatting', async () => {
  const p = path.resolve('.kiro/specs/developer-environment-docker-desktop/tasks.md');
  const text = await fs.readFile(p, 'utf8');
  assert.match(text, /- \[( |x)\]/, 'Expected at least one checkbox "- [ ]" or "- [x]" in tasks.md');
});


