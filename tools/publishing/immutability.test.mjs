import test from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { releasePathFromVersion } from './paths.mjs';
import { assertReleaseWriteIsAllowed } from './paths.mjs';

test('Property: Release immutability — writing to existing version is rejected', async (t) => {
	await t.test('fast-check', async () => {
		// Create unique temp dir per test run
		const base = await fs.mkdtemp(path.join(os.tmpdir(), 'publishing-'));
		try {
			await fc.assert(
				fc.asyncProperty(
					fc.tuple(
						fc.nat({ max: 1_000_000 }),
						fc.nat({ max: 1_000_000 }),
						fc.nat({ max: 1_000_000 }),
					),
					async ([major, minor, patch]) => {
						const version = `${major}.${minor}.${patch}`;
						const relPath = releasePathFromVersion(version); // e.g., /releases/1.2.3/
						const fsPath = path.join(base, relPath.slice(1)); // strip leading slash

						// Before path exists, writes should be allowed
						assert.doesNotThrow(() => assertReleaseWriteIsAllowed(base, version));

						// Create the release directory (simulating a published version)
						await fs.mkdir(fsPath, { recursive: true });

						// After path exists, writes must be rejected
						assert.throws(
							() => assertReleaseWriteIsAllowed(base, version),
							/immutable|exists/i,
						);
					}
				),
				{ numRuns: 100 },
			);
		} finally {
			// Best-effort cleanup
			await fs.rm(base, { recursive: true, force: true });
		}
	});
});


