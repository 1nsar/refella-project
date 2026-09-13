import { mkdir, readFile, writeFile, rename, chmod } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { State } from './core';

// One API process owns this file. Never serve it as a static asset.
export function fileStore(path: string) {
  return {
    async load(): Promise<State | undefined> {
      try { return JSON.parse(await readFile(path, 'utf8')) as State; }
      catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return; throw error; }
    },
    async save(state: State) {
      await mkdir(dirname(path), { recursive: true, mode: 0o700 });
      await chmod(dirname(path), 0o700);
      const temporary = `${path}.${randomUUID()}.tmp`;
      await writeFile(temporary, JSON.stringify(state), { mode: 0o600, flag: 'wx' });
      await rename(temporary, path);
    },
  };
}
