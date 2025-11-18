#!/usr/bin/env node
/**
 * Decision engine for reuse policy: compute retrieval, metadata, features, constraints,
 * score and final Accept/Abstain decision; emit evidence JSON.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { loadPolicy } from './reuse_policy.mjs';

export async function runDecision({ indexPath, query, k, outPath }) {
	const index = await loadIndex(indexPath);
	const { policy } = await loadPolicy();
	const kEff = Math.max(1, Number.isFinite(k) ? k : policy.k);
	const retrieval = lexicalRetrieval(index, query, kEff);
	const hits = retrieval.map((r) => {
		const s_den = 0; // dense disabled (offline default)
		const s_hyb = policy.alpha * r.s_lex + (1 - policy.alpha) * s_den;
		return { path: r.path, s_lex: r.s_lex, s_den, s_hyb };
	});
	hits.sort((a, b) => b.s_hyb - a.s_hyb);
	const top1 = hits[0];
	const top2 = hits[1] ?? { s_hyb: 0, s_lex: 0 };
	const metadata = await extractMetadata(index.root_path, top1?.path ?? '');
	const features = computeFeatures({ hits, metadata, policy });
	const constraints = evaluateConstraints({ metadata, policy });
	const scoreTop1 = score(features, policy.weights);
	const scoreTop2 = score(
		{ ...features, phi_lex1: top2.s_hyb, phi_gap: Math.max(0, top2.s_hyb - (hits[2]?.s_hyb ?? 0)) },
		policy.weights,
	);
	const margin = scoreTop1 - scoreTop2;
	const decision = constraints.pass && scoreTop1 >= policy.tau && margin >= policy.delta ? 'Accept' : 'Abstain';

	const evidence = {
		version: 1,
		created_at: new Date().toISOString(),
		host: os.hostname(),
		corpus_root: index.root_path,
		index_created_at: index.created_at,
		index_version: index.version ?? 1,
		policy_version: policy.version,
		policy_owner: policy.owner,
		k: kEff,
		alpha: policy.alpha,
		tau: policy.tau,
		delta: policy.delta,
		weights: policy.weights,
		query_raw: query,
		retrieval: hits,
		metadata,
		features,
		constraints,
		score: Number(scoreTop1.toFixed(6)),
		margin: Number(margin.toFixed(6)),
		decision,
		seed: policy.seed,
	};
	if (outPath) {
		await ensureDir(path.dirname(outPath));
		await fs.writeFile(outPath, JSON.stringify(evidence, null, 2), 'utf8');
	}
	return evidence;
}

function tokenize(text) {
	const m = text.toLowerCase().match(/[a-z0-9_]+/g);
	return m ? m : [];
}

function cosineSparseMap(mapA, arrB) {
	let dot = 0;
	let normA = 0;
	let normB = 0;
	for (const [, w] of mapA) normA += w * w;
	for (const [, w] of arrB) normB += w * w;
	const mapB = new Map(arrB);
	for (const [term, weightA] of mapA) {
		const weightB = mapB.get(term);
		if (weightB) dot += weightA * weightB;
	}
	const denom = Math.sqrt(normA) * Math.sqrt(normB);
	return denom === 0 ? 0 : dot / denom;
}

function lexVectorFromTokens(tokens, idf) {
	const tf = new Map();
	for (const term of tokens) tf.set(term, (tf.get(term) || 0) + 1);
	const total = tokens.length || 1;
	const vec = new Map();
	for (const [term, count] of tf.entries()) {
		const idfVal = idf.get(term);
		if (!idfVal) continue;
		vec.set(term, (count / total) * idfVal);
	}
	return vec;
}

function lexicalRetrieval(index, query, k) {
	const idf = new Map(Object.entries(index.idf));
	const qvec = lexVectorFromTokens(tokenize(query), idf);
	const scores = [];
	for (const doc of index.docs) {
		const s_lex = cosineSparseMap(qvec, doc.vector);
		scores.push({ path: doc.path, s_lex });
	}
	scores.sort((a, b) => b.s_lex - a.s_lex);
	return scores.slice(0, k);
}

async function loadIndex(indexPath) {
	const p = indexPath ? path.resolve(indexPath) : path.resolve('.kiro/reuse/index.json');
	const raw = await fs.readFile(p, 'utf8');
	return JSON.parse(raw);
}

async function extractMetadata(rootPath, relPath) {
	const absPath = path.join(rootPath, relPath);
	const info = {
		license: null,
		recency_days: null,
		cves: [],
		stars: null,
		downloads: null,
		language: inferLanguage(relPath),
		api_fit_bool: null,
		citations: [],
	};
	try {
		const stat = await fs.stat(absPath);
		const days = Math.floor((Date.now() - stat.mtimeMs) / (24 * 60 * 60 * 1000));
		info.recency_days = Math.max(0, days);
		info.citations.push(relPath);
	} catch {
		// ignore
	}
	// Try to find license via package.json or LICENSE file upward
	const pkg = await findUp(absPath, ['package.json']);
	if (pkg) {
		try {
			const raw = await fs.readFile(pkg, 'utf8');
			const pkgJson = JSON.parse(raw);
			if (pkgJson.license && typeof pkgJson.license === 'string') {
				info.license = pkgJson.license;
				info.citations.push(path.relative(rootPath, pkg));
			}
		} catch {
			// ignore
		}
	}
	if (!info.license) {
		const lic = await findUp(absPath, ['LICENSE', 'LICENSE.txt', 'LICENSE.md', 'COPYING']);
		if (lic) {
			try {
				const text = await fs.readFile(lic, 'utf8');
				info.license = detectLicenseFromText(text);
				info.citations.push(path.relative(rootPath, lic));
			} catch {
				// ignore
			}
		}
	}
	return info;
}

function inferLanguage(relPath) {
	const ext = path.extname(relPath).toLowerCase();
	const map = {
		'.ts': 'TypeScript',
		'.tsx': 'TypeScript',
		'.js': 'JavaScript',
		'.mjs': 'JavaScript',
		'.cjs': 'JavaScript',
		'.py': 'Python',
		'.java': 'Java',
		'.kt': 'Kotlin',
		'.go': 'Go',
		'.rs': 'Rust',
		'.rb': 'Ruby',
		'.cpp': 'C++',
		'.c': 'C',
		'.sh': 'Shell',
		'.ttl': 'Turtle',
	};
	return map[ext] || null;
}

async function findUp(startAbsPath, fileNames) {
	let dir = path.dirname(startAbsPath);
	for (let i = 0; i < 20; i += 1) {
		for (const name of fileNames) {
			const candidate = path.join(dir, name);
			try {
				const stat = await fs.stat(candidate);
				if (stat.isFile()) return candidate;
			} catch {
				// ignore
			}
		}
		const parent = path.dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	return null;
}

function detectLicenseFromText(text) {
	const t = text.toLowerCase();
	if (t.includes('mit license')) return 'MIT';
	if (t.includes('apache license') && t.includes('2.0')) return 'Apache-2.0';
	if (t.includes('bsd')) return 'BSD-2/3-Clause';
	if (t.includes('mozilla public license') || t.includes('mpl')) return 'MPL-2.0';
	if (t.includes('gnu general public license') || t.includes(' gpl ')) return 'GPL';
	if (t.includes('lesser general public license') || t.includes(' lgpl ')) return 'LGPL';
	if (t.includes('affero general public license') || t.includes(' agpl ')) return 'AGPL';
	return null;
}

function isOsi(license) {
	if (!license) return false;
	const v = String(license).toUpperCase();
	return (
		v.includes('MIT') ||
		v.includes('APACHE') ||
		v.includes('BSD') ||
		v.includes('MPL') ||
		v.includes('GPL') ||
		v.includes('LGPL') ||
		v.includes('AGPL')
	);
}

function computeFeatures({ hits, metadata, policy }) {
	const best = hits[0] ?? { s_hyb: 0, s_lex: 0 };
	const second = hits[1] ?? { s_hyb: 0, s_lex: 0 };
	const phi_lex1 = best.s_hyb; // hybrid when available (currently lexical-only)
	const phi_gap = Math.max(0, best.s_hyb - second.s_hyb);
	const recencyDays = Number.isFinite(metadata.recency_days) ? metadata.recency_days : policy.recency_days;
	const phi_recency = 1 - Math.min(1, recencyDays / policy.recency_days);
	const phi_osi = isOsi(metadata.license) ? 1 : 0;
	const hasHighCve = (metadata.cves ?? []).some((c) => Number(c?.cvss ?? 0) >= policy.cve_threshold);
	const phi_cve_penalty = hasHighCve ? 1 : 0; // multiplied by negative weight
	const phi_popularity = 0; // offline default; can be populated in future
	return { phi_lex1, phi_gap, phi_recency, phi_osi, phi_popularity, phi_cve_penalty };
}

function evaluateConstraints({ metadata, policy }) {
	const c_osi = isOsi(metadata.license);
	const c_cve = !((metadata.cves ?? []).some((c) => Number(c?.cvss ?? 0) >= policy.cve_threshold));
	const c_recency = Number.isFinite(metadata.recency_days) ? metadata.recency_days <= policy.recency_days : true;
	const pass = Boolean(c_osi && c_cve && c_recency);
	return { pass, c_osi, c_cve, c_recency };
}

function score(features, weights) {
	let s = 0;
	for (const [name, weight] of Object.entries(weights)) {
		const v = Number(features[name] ?? 0);
		s += Number(weight) * v;
	}
	return s;
}

async function ensureDir(dirPath) {
	await fs.mkdir(dirPath, { recursive: true });
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
	(async () => {
		const { indexPath, query, k, outPath } = parseArgs(process.argv.slice(2));
		if (!query) {
			console.error('reuse_decision: Missing --query "<text>"');
			process.exit(1);
		}
		const evidence = await runDecision({ indexPath, query, k, outPath });
		console.log(evidence.decision);
	})().catch((err) => {
		console.error(`reuse_decision error: ${err?.message ?? String(err)}`);
		process.exit(1);
	});
}

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


