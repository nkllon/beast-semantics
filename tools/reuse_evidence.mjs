#!/usr/bin/env node
/**
 * Generate structured evidence JSON for reuse/no-invention decisions.
 *
 * Usage:
 *   node tools/reuse_evidence.mjs --index .kiro/reuse/index.json --query "semver versioning gate" --k 10 --out .kiro/evidence/semver.json
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

function parseArgs(argv) {
	let indexPath = path.join('.kiro', 'reuse', 'index.json');
	let query = '';
	let k = 10;
	let outPath = path.join('.kiro', 'evidence', `evidence-${Date.now()}.json`);
	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (arg === '--index') indexPath = argv[++i] || indexPath;
		else if (arg === '--query') query = argv[++i] || '';
		else if (arg === '--k') k = parseInt(argv[++i] || '10', 10);
		else if (arg === '--out') outPath = argv[++i] || outPath;
		else {
			console.error(`Unknown argument: ${arg}`);
			process.exit(1);
		}
	}
	if (!query) {
		console.error('reuse_evidence: Missing --query "<text>"');
		process.exit(1);
	}
	return { indexPath: path.resolve(indexPath), query, k, outPath: path.resolve(outPath) };
}

function tokenize(text) {
	const matches = text.toLowerCase().match(/[a-z0-9_]+/g);
	return matches ? matches : [];
}

function vectorFromTokens(tokens, idf) {
	const tf = new Map();
	for (const term of tokens) tf.set(term, (tf.get(term) || 0) + 1);
	const total = tokens.length || 1;
	const vector = new Map();
	for (const [term, count] of tf.entries()) {
		const idfVal = idf.get(term);
		if (!idfVal) continue;
		vector.set(term, (count / total) * idfVal);
	}
	return vector;
}

function cosineSparse(vecA, vecB) {
	let dot = 0;
	let normA = 0;
	let normB = 0;
	for (const [, w] of vecA) normA += w * w;
	for (const [, w] of vecB) normB += w * w;
	const mapB = new Map(vecB);
	for (const [term, weightA] of vecA) {
		const weightB = mapB.get(term);
		if (weightB) dot += weightA * weightB;
	}
	const denom = Math.sqrt(normA) * Math.sqrt(normB);
	return denom === 0 ? 0 : dot / denom;
}

async function ensureDir(dirPath) {
	await fs.mkdir(dirPath, { recursive: true });
}

async function main() {
	const { indexPath, query, k, outPath } = parseArgs(process.argv.slice(2));
	const raw = await fs.readFile(indexPath, 'utf8');
	const index = JSON.parse(raw);
	const idf = new Map(Object.entries(index.idf));
	const queryVec = vectorFromTokens(tokenize(query), idf);
	const results = [];
	for (const doc of index.docs) {
		const score = cosineSparse(queryVec, doc.vector);
		results.push({ path: doc.path, score });
	}
	results.sort((a, b) => b.score - a.score);
	const top = results.slice(0, Math.max(1, k));
	const evidence = {
		version: 1,
		created_at: new Date().toISOString(),
		host: os.hostname(),
		fort_root: index.root_path,
		index_created_at: index.created_at,
		query,
		top_k: k,
		results: top,
	};
	await ensureDir(path.dirname(outPath));
	await fs.writeFile(outPath, JSON.stringify(evidence, null, 2), 'utf8');
	console.log(`Reuse evidence written: ${outPath}`);
}

main().catch((err) => {
	console.error(`reuse_evidence error: ${err?.message ?? String(err)}`);
	process.exit(1);
});


