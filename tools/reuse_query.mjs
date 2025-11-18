#!/usr/bin/env node
/**
 * Query the reuse TF-IDF index and print top-k nearest documents with hybrid scores.
 *
 * Usage:
 *   node tools/reuse_query.mjs --index .kiro/reuse/index.json --query "semver validation" --k 10
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { loadPolicy } from './reuse_policy.mjs';

function parseArgs(argv) {
	let indexPath = path.join('.kiro', 'reuse', 'index.json');
	let query = '';
	let k = 10;
	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (arg === '--index') {
			indexPath = argv[++i] || indexPath;
		} else if (arg === '--query') {
			query = argv[++i] || '';
		} else if (arg === '--k') {
			k = parseInt(argv[++i] || '10', 10);
		} else {
			console.error(`Unknown argument: ${arg}`);
			process.exit(1);
		}
	}
	if (!query) {
		console.error('reuse_query: Missing --query "<text>"');
		process.exit(1);
	}
	return { indexPath: path.resolve(indexPath), query, k };
}

function tokenize(text) {
	const matches = text.toLowerCase().match(/[a-z0-9_]+/g);
	return matches ? matches : [];
}

function vectorFromTokens(tokens, idf) {
	const tf = new Map();
	for (const term of tokens) {
		tf.set(term, (tf.get(term) || 0) + 1);
	}
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

async function main() {
	const { indexPath, query, k } = parseArgs(process.argv.slice(2));
	const raw = await fs.readFile(indexPath, 'utf8');
	const index = JSON.parse(raw);
	const { policy } = await loadPolicy();
	const idf = new Map(Object.entries(index.idf));
	const queryVec = vectorFromTokens(tokenize(query), idf);
	const results = [];
	for (const doc of index.docs) {
		const docVec = doc.vector;
		const score = cosineSparse(queryVec, docVec);
		const s_lex = score;
		const s_den = 0; // dense disabled (offline default)
		const s_hyb = policy.alpha * s_lex + (1 - policy.alpha) * s_den;
		results.push({ path: doc.path, s_lex, s_den, s_hyb });
	}
	results.sort((a, b) => b.s_hyb - a.s_hyb);
	const top = results.slice(0, Math.max(1, k));
	for (const r of top) {
		console.log(`${r.s_hyb.toFixed(4)}\t${r.s_lex.toFixed(4)}\t${r.path}`);
	}
}

main().catch((err) => {
	console.error(`reuse_query error: ${err?.message ?? String(err)}`);
	process.exit(1);
});


