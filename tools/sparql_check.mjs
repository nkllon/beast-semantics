#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';

// Lazy import to avoid requiring these outside CI
let SparqlParser, formatQuery;
async function loadDeps() {
	const sparqljs = await import('sparqljs');
	SparqlParser = sparqljs.Parser;
	try {
		// Optional; not required when using heuristic drift detection
		await import('sparql-formatter');
		formatQuery = null;
	} catch {
		formatQuery = null;
	}
}

async function listFiles(startDir, predicate) {
	const results = [];
	async function walk(dir) {
		let entries;
		try {
			entries = await fs.readdir(dir, { withFileTypes: true });
		} catch {
			return;
		}
		for (const ent of entries) {
			const full = path.join(dir, ent.name);
			if (ent.isDirectory()) {
				await walk(full);
			} else if (ent.isFile() && predicate(full)) {
				results.push(full);
			}
		}
	}
	await walk(startDir);
	return results;
}

function posFromError(err) {
	// sparqljs includes token location when available
	const m = /line (\d+), column (\d+)/i.exec(err?.message ?? '');
	if (m) {
		return { line: Number(m[1]), column: Number(m[2]) };
	}
	return { line: 1, column: 1 };
}

function hasFormattingDrift(text) {
	// Heuristics to detect obvious formatting drift without enforcing a canonical pretty-print
	// 1) No space after WHERE before '{'
	if (/\bwhere\{/.test(text.toLowerCase())) return true;
	// 2) Missing spaces between subject, predicate, object (e.g., '?s?p?o')
	if (/\?[A-Za-z0-9_]+\?[A-Za-z0-9_]+\?[A-Za-z0-9_]+/.test(text)) return true;
	// 3) Compressed braces with terms, e.g., '{?s' or 'o.}'
	if (/\{\s*\?/.test(text) === false && /\{\?/.test(text)) return true;
	return false;
}

async function main() {
	await loadDeps();
	const baseDir = process.argv[2] || 'queries';
	const enforceFormat = String(process.env.ENFORCE_SPQ_FORMAT || '').toLowerCase() === 'true';
	const files = await listFiles(baseDir, (f) => f.toLowerCase().endsWith('.rq'));
	if (files.length === 0) {
		console.log(`No SPARQL files found under ${baseDir}`);
		return 0;
	}
	const parser = new SparqlParser();
	let hasErrors = false;
	for (const file of files) {
		const text = await fs.readFile(file, 'utf8');
		try {
			parser.parse(text);
		} catch (err) {
			hasErrors = true;
			const { line, column } = posFromError(err);
			// reviewdog-compatible generic efm: "%f:%l:%c: %t%*[^:]: %m"
			console.error(`${file}:${line}:${column}: error: ${String(err.message).replace(/\n/g, ' ')}`);
			continue;
		}
		// formatting check (warn-only by default)
		try {
			if (hasFormattingDrift(text)) {
				const level = enforceFormat ? 'error' : 'warning';
				// Point to first line
				console.error(`${file}:1:1: ${level}: formatting differs from canonical`);
				if (enforceFormat) {
					hasErrors = true;
				}
			}
		} catch {
			// ignore formatter failures
		}
	}
	return hasErrors ? 1 : 0;
}

main().then((code) => process.exit(code)).catch((e) => {
	console.error(`sparql_check error: ${e?.message ?? e}`);
	process.exit(2);
});


