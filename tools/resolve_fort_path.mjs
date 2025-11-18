import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

export async function resolveFortPath() {
	const envPath = process.env.FORT_DESKTOP;
	if (envPath && await isDir(envPath)) return path.resolve(envPath);

	// 0) ~/.env (dotenv format)
	const homeEnv = await readDotenvValue('FORT_DESKTOP');
	if (homeEnv && await isDir(homeEnv)) return path.resolve(homeEnv);

	// 1) Explicit single-line config file takes precedence
	const configFile = path.resolve('.kiro/steering-custom/fort.path');
	try {
		const text = (await fs.readFile(configFile, 'utf8')).trim();
		if (text && text.startsWith('/') && await isDir(text)) return text;
	} catch { /* no file or unreadable */ }

	// 2) Parse external-sources.md for an absolute path entry
	const extMd = path.resolve('.kiro/steering-custom/external-sources.md');
	try {
		const md = await fs.readFile(extMd, 'utf8');
		const block = findFortBlock(md);
		const p = extractAbsolutePath(block);
		if (p && await isDir(p)) return p;
	} catch { /* ignore */ }

	return '';
}

export async function requireFortPathOrFail() {
	const p = await resolveFortPath();
	if (p) return p;
	console.error([
		'Fort Desktop path not configured for this session.',
		'Configure one of the following durable options:',
		'  1) Create file .kiro/steering-custom/fort.path with a single absolute path line',
		'  2) Add FORT_DESKTOP=/absolute/path to ~/.env (dotenv format)',
		'  3) Add an absolute path under "Fort desktop projects" in .kiro/steering-custom/external-sources.md',
		'  4) Export FORT_DESKTOP in this session before running commands',
	].join('\n'));
	process.exit(1);
}

async function isDir(p) {
	try {
		const st = await fs.stat(p);
		return st.isDirectory();
	} catch { return false; }
}

async function readDotenvValue(key) {
	const home = os.homedir();
	const dotenvPath = path.join(home, '.env');
	try {
		const text = await fs.readFile(dotenvPath, 'utf8');
		const lines = text.split(/\r?\n/);
		for (const raw of lines) {
			const line = raw.trim();
			if (!line || line.startsWith('#')) continue;
			const idx = line.indexOf('=');
			if (idx === -1) continue;
			const k = line.slice(0, idx).trim();
			if (k !== key) continue;
			let v = line.slice(idx + 1).trim();
			if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
				v = v.slice(1, -1);
			}
			return v;
		}
	} catch { /* ignore */ }
	return '';
}

function findFortBlock(md) {
	// crude slice between '- name: Fort desktop projects' and next list item or end
	const startIdx = md.indexOf('- name: Fort desktop projects');
	if (startIdx === -1) return '';
	let endIdx = md.indexOf('\n- name:', startIdx + 1);
	if (endIdx === -1) endIdx = md.length;
	return md.slice(startIdx, endIdx);
}

function extractAbsolutePath(block) {
	// look for line starting with 'path:' and capture absolute paths
	const lines = block.split(/\r?\n/);
	for (const line of lines) {
		const m = line.match(/^\s*path:\s*(.+)\s*$/);
		if (!m) continue;
		const raw = m[1].trim();
		if (raw.startsWith('${')) continue; // ignore env placeholders
		if (raw.startsWith('/')) return raw;
	}
	return '';
}


