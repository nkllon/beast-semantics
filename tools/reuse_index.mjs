#!/usr/bin/env node
/**
 * Build a deterministic TF-IDF index over the Fort Desktop tree for reuse discovery.
 *
 * Inputs:
 *   --root <path>    (optional) absolute path to Fort; defaults to process.env.FORT_DESKTOP
 *   --out <path>     (optional) output JSON; defaults to .kiro/reuse/index.json
 *
 * Behavior:
 *   - Recursively scans text/code files
 *   - Tokenizes to alnum words
 *   - Computes DF/IDF with smoothing
 *   - Stores per-document sparse vectors { term, weight }
 *   - Writes index with metadata (created_at, root_path, num_docs, terms)
 *
 * Exit codes:
 *   0 success, 1 failure
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { resolveFortPath, requireFortPathOrFail } from './resolve_fort_path.mjs';

const DEFAULT_IGNORE_DIRS = new Set(['.git', '.svn', 'node_modules', 'dist', 'build', '.cache', '.idea', '.vscode', '__pycache__']);
const DEFAULT_EXTS = new Set([
	'.md', '.txt', '.rst', '.json', '.yml', '.yaml',
	'.py', '.js', '.mjs', '.cjs', '.ts', '.tsx',
	'.java', '.kt', '.go', '.rb', '.rs', '.cpp', '.c', '.h', '.hpp',
	'.sh', '.bash', '.zsh',
	'.ttl', '.rq', '.sparql',
]);

function parseArgs(argv) {
	let root = '';
	let out = path.join('.kiro', 'reuse', 'index.json');
	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (arg === '--root') {
			root = argv[++i] || '';
		} else if (arg === '--out') {
			out = argv[++i] || out;
		} else {
			console.error(`Unknown argument: ${arg}`);
			process.exit(1);
		}
	}
	return { root: path.resolve(root), out: path.resolve(out) };
}

async function* walkFiles(dir) {
	const entries = await fs.readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		if (entry.isDirectory()) {
			if (DEFAULT_IGNORE_DIRS.has(entry.name)) continue;
			yield* walkFiles(path.join(dir, entry.name));
		} else if (entry.isFile()) {
			yield path.join(dir, entry.name);
		}
	}
}

function isIndexable(filePath) {
	const ext = path.extname(filePath).toLowerCase();
	return DEFAULT_EXTS.has(ext);
}

async function readText(filePath) {
	try {
		const buf = await fs.readFile(filePath);
		// crude binary check
		const text = buf.toString('utf8');
		return text;
	} catch {
		return '';
	}
}

function tokenize(text) {
	const matches = text.toLowerCase().match(/[a-z0-9_]+/g);
	return matches ? matches : [];
}

function computeTfidf(docTokensList) {
	const numDocs = docTokensList.length;
	const df = new Map();
	for (const tokens of docTokensList) {
		const unique = new Set(tokens);
		for (const term of unique) {
			df.set(term, (df.get(term) || 0) + 1);
		}
	}
	const idf = new Map();
	for (const [term, count] of df.entries()) {
		const value = Math.log((numDocs + 1) / (count + 1)) + 1;
		idf.set(term, value);
	}
	const vectors = [];
	for (const tokens of docTokensList) {
		const tf = new Map();
		for (const term of tokens) {
			tf.set(term, (tf.get(term) || 0) + 1);
		}
		const total = tokens.length || 1;
		const vector = [];
		for (const [term, freq] of tf.entries()) {
			const weight = (freq / total) * (idf.get(term) || 0);
			if (weight > 0) vector.push([term, weight]);
		}
		vectors.push(vector);
	}
	return { idf, vectors };
}

async function ensureDir(dirPath) {
	await fs.mkdir(dirPath, { recursive: true });
}

async function main() {
	let { root, out } = parseArgs(process.argv.slice(2));
	if (!root) {
		// try durable config/env fallback
		root = await resolveFortPath();
		if (!root) {
			await requireFortPathOrFail(); // exits with guidance
		}
	}
	const docPaths = [];
	for await (const file of walkFiles(root)) {
		if (isIndexable(file)) docPaths.push(file);
	}
	if (docPaths.length === 0) {
		console.error(`reuse_index: No indexable files under ${root}`);
		process.exit(1);
	}
	const docTokensList = [];
	for (const p of docPaths) {
		const text = await readText(p);
		docTokensList.push(tokenize(text));
	}
	const { idf, vectors } = computeTfidf(docTokensList);
	const idfObj = Object.fromEntries(idf.entries());
	const docs = [];
	for (let i = 0; i < docPaths.length; i += 1) {
		const rel = path.relative(root, docPaths[i]);
		docs.push({ path: rel, vector: vectors[i] });
	}
	const index = {
		version: 1,
		created_at: new Date().toISOString(),
		root_path: root,
		host: os.hostname(),
		num_docs: docs.length,
		terms: Object.keys(idfObj).length,
		idf: idfObj,
		docs,
	};
	await ensureDir(path.dirname(out));
	await fs.writeFile(out, JSON.stringify(index), 'utf8');
	console.log(`Reuse index written: ${out}`);
	console.log(`Documents indexed: ${docs.length}`);
}

main().catch((err) => {
	console.error(`reuse_index error: ${err?.message ?? String(err)}`);
	process.exit(1);
});


