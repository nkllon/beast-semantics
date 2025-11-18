import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { parseSimpleYaml } from './util_yaml.mjs';

const DEFAULT_POLICY = {
	version: '0.1.0',
	owner: 'platform-engineering',
	k: 10,
	alpha: 1.0,
	tau: 0.65,
	delta: 0.10,
	recency_days: 365,
	cve_threshold: 7.0,
	weights: {
		phi_lex1: 0.60,
		phi_gap: 0.20,
		phi_recency: 0.10,
		phi_osi: 0.08,
		phi_popularity: 0.02,
		phi_cve_penalty: -0.50,
	},
	seed: 12345,
};

export async function loadPolicy(policyPath = path.resolve('.kiro/steering/policy.reuse.yml')) {
	let text = '';
	try {
		text = await fs.readFile(policyPath, 'utf8');
	} catch (err) {
		throw new Error(`Policy not found at ${policyPath}. Create it per spec. ${err?.message ?? ''}`);
	}
	const raw = parseSimpleYaml(text);
	const policy = normalizePolicy(raw);
	return { policy, policyPath, host: os.hostname() };
}

function normalizePolicy(raw) {
	const out = { ...DEFAULT_POLICY, ...raw };
	out.k = toNum(out.k, DEFAULT_POLICY.k);
	out.alpha = clamp01(toNum(out.alpha, DEFAULT_POLICY.alpha));
	out.tau = clamp01(toNum(out.tau, DEFAULT_POLICY.tau));
	out.delta = clamp01(toNum(out.delta, DEFAULT_POLICY.delta));
	out.recency_days = Math.max(1, Math.floor(toNum(out.recency_days, DEFAULT_POLICY.recency_days)));
	out.cve_threshold = Math.max(0, toNum(out.cve_threshold, DEFAULT_POLICY.cve_threshold));
	out.weights = { ...DEFAULT_POLICY.weights, ...(raw?.weights ?? {}) };
	for (const [k, v] of Object.entries(out.weights)) {
		out.weights[k] = Number(v);
		if (!Number.isFinite(out.weights[k])) out.weights[k] = DEFAULT_POLICY.weights[k] ?? 0;
	}
	out.seed = Math.floor(toNum(out.seed, DEFAULT_POLICY.seed));
	return out;
}

function toNum(v, d) {
	const n = Number(v);
	return Number.isFinite(n) ? n : d;
}

function clamp01(x) {
	return Math.max(0, Math.min(1, x));
}


