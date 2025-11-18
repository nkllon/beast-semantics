#!/usr/bin/env node
/**
 * Preflight checks (deterministic, non-LLM):
 * - Fort Desktop path requirement and existence
 * - Node package presence checks
 *
 * Usage:
 *   node tools/preflight.mjs --fort-required --require-packages semver fast-check --require-reuse-index 7
 *
 * Exit codes:
 *   0 = OK
 *   1 = Preflight failed
 *   2 = Invalid usage
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { requireFortPathOrFail } from './resolve_fort_path.mjs';

function parseArgs(argv) {
	const args = { fortRequired: false, requiredPackages: [], requireReuseIndexDays: 0 };
	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (arg === '--fort-required') {
			args.fortRequired = true;
		} else if (arg === '--require-packages') {
			const pkgs = [];
			for (let j = i + 1; j < argv.length; j += 1) {
				if (argv[j].startsWith('--')) break;
				pkgs.push(argv[j]);
				i = j;
			}
			args.requiredPackages.push(...pkgs);
		} else if (arg === '--require-reuse-index') {
			const days = parseInt(argv[++i] || '0', 10);
			args.requireReuseIndexDays = Number.isFinite(days) ? days : 0;
		} else {
			console.error(`Unknown argument: ${arg}`);
			process.exit(2);
		}
	}
	return args;
}

async function ensureFortPathIfRequired(required) {
	if (!required) return;
	await requireFortPathOrFail();
}

async function ensureNodePackages(packages) {
	for (const name of packages) {
		try {
			// Resolve from project root based on CWD
			const resolved = await import(pathToImport(name));
			void resolved;
		} catch {
			console.error(`Preflight error: Required package "${name}" is not available. Add it to package.json and install.`);
			process.exit(1);
		}
	}
}

function pathToImport(name) {
	// Allow bare specifiers for ESM import()
	return name;
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	await ensureFortPathIfRequired(args.fortRequired);
	await ensureNodePackages(args.requiredPackages);
	if (args.requireReuseIndexDays > 0) {
		const indexPath = path.resolve('.kiro/reuse/index.json');
		try {
			const stat = await fs.stat(indexPath);
			const ageMs = Date.now() - stat.mtimeMs;
			const maxMs = args.requireReuseIndexDays * 24 * 60 * 60 * 1000;
			if (ageMs > maxMs) {
				console.error(`Preflight error: Reuse index is older than ${args.requireReuseIndexDays} day(s). Rebuild with: node tools/reuse_index.mjs`);
				process.exit(1);
			}
		} catch {
			console.error('Preflight error: Reuse index missing. Build with: node tools/reuse_index.mjs');
			process.exit(1);
		}
	}
	console.log('Preflight OK');
}

main().catch((err) => {
	console.error(`Preflight unexpected error: ${err?.message ?? String(err)}`);
	process.exit(1);
});


