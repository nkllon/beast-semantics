import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = path.resolve('tools/automation/playwright');
const files = [
	path.join(base, 'package.json'),
	path.join(base, 'tsconfig.json'),
	path.join(base, 'playwright.config.ts'),
	path.join(base, 'README.md'),
];

test('Playwright scaffold files exist', async () => {
	for (const f of files) {
		const stat = await fs.stat(f);
		assert.ok(stat.isFile(), `Missing file ${f}`);
	}
});


