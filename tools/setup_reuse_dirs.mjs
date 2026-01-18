#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

async function ensureDir(dirPath) {
	await fs.mkdir(dirPath, { recursive: true });
}

(async () => {
	await ensureDir(path.resolve('.kiro/evidence'));
	await ensureDir(path.resolve('.kiro/eval/reuse'));
	console.log('Ensured: .kiro/evidence and .kiro/eval/reuse');
})().catch((err) => {
	console.error(`setup_reuse_dirs error: ${err?.message ?? String(err)}`);
	process.exit(1);
});


