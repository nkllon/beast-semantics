import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const gatewayDir = path.resolve('tools/gateways');

function* walk(dir) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			yield* walk(full);
		} else {
			yield full;
		}
	}
}

test('No hardcoded credentials in gateway code or configs', () => {
	const patterns = [
		/Authorization:\s*Bearer\s+[A-Za-z0-9\-_]{20,}/i,
		/\bghp_[A-Za-z0-9]{20,}\b/,
		/-----BEGIN (RSA )?PRIVATE KEY-----/,
		/\bAWS_SECRET_ACCESS_KEY\b\s*[:=]\s*['"][A-Za-z0-9\/+=]{20,}['"]/,
		/\bapi[_-]?key\b\s*[:=]\s*['"][A-Za-z0-9\-_]{12,}['"]/i,
		/\bpassword\b\s*[:=]\s*['"].+['"]/i
	];
	const offenders = [];
	for (const file of walk(gatewayDir)) {
		if (!/\.(mjs|js|json|md|ts|yml|yaml)$/i.test(file)) continue;
		const text = fs.readFileSync(file, 'utf-8');
		for (const re of patterns) {
			if (re.test(text)) {
				offenders.push({ file, re: String(re) });
			}
		}
	}
	assert.equal(offenders.length, 0, `Found potential hardcoded credentials:\n${offenders.map(o => `${o.file} :: ${o.re}`).join('\n')}`);
});


