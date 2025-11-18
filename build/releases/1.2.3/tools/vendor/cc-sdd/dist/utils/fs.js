import { mkdir, stat } from 'node:fs/promises';
export const ensureDir = async (dir) => {
    await mkdir(dir, { recursive: true });
};
export const fileExists = async (target) => {
    try {
        await stat(target);
        return true;
    }
    catch {
        return false;
    }
};
