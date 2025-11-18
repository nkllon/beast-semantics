#!/usr/bin/env node
/**
 * Generate full decision evidence JSON for reuse/no-invention decisions.
 *
 * Usage:
 *   node tools/reuse_evidence.mjs --index .kiro/reuse/index.json --query "semver versioning gate" --k 10 --out .kiro/evidence/semver.json
 */
import path from 'node:path';
import { runDecision } from './reuse_decision.mjs';

function parseArgs(argv) {
	let indexPath = path.join('.kiro', 'reuse', 'index.json');
	let query = '';
	let k = undefined;
	let outPath = path.join('.kiro', 'evidence', `decision-${Date.now()}.json`);
	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (arg === '--index') indexPath = argv[++i] || indexPath;
		else if (arg === '--query') query = argv[++i] || '';
		else if (arg === '--k') k = parseInt(argv[++i] || '', 10);
		else if (arg === '--out') outPath = argv[++i] || outPath;
		else {
			console.error(`Unknown argument: ${arg}`);
			process.exit(2);
		}
	}
	return { indexPath: path.resolve(indexPath), query, k, outPath: path.resolve(outPath) };
}

async function main() {
	const { indexPath, query, k, outPath } = parseArgs(process.argv.slice(2));
	if (!query) {
		console.error('reuse_evidence: Missing --query "<text>"');
		process.exit(1);
	}
	const evidence = await runDecision({ indexPath, query, k, outPath });
	console.log(`${evidence.decision} ${outPath}`);
}

main().catch((err) => {
	console.error(`reuse_evidence error: ${err?.message ?? String(err)}`);
	process.exit(1);
});

