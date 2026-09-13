import { mkdir, open, rename, unlink, lstat, chmod } from 'node:fs/promises';
import { resolve, join, basename } from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

export const draftSchema = z.object({
  businessName: z.string().trim().min(1).max(120),
  businessType: z.string().trim().min(1).max(120),
  channel: z.enum(['telegram', 'whatsapp', 'imessage', 'web']),
  integrationMode: z.enum(['our-agent', 'existing-agent']),
  offer: z.string().trim().min(1).max(1000),
}).strict();
export type DraftInput = z.infer<typeof draftSchema>;
export interface SavedDraft extends DraftInput { id: string; status: 'draft'; createdAt: string }
export function defaultDataDirectory() {
  return resolve(basename(process.cwd()) === 'runtime' ? '.' : 'runtime', '.onboarding-data');
}
export async function saveDraft(input: DraftInput, directory = defaultDataDirectory()): Promise<SavedDraft> {
  const draft: SavedDraft = { ...draftSchema.parse(input), id: randomUUID(), status: 'draft', createdAt: new Date().toISOString() };
  const dir = resolve(directory);
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const stats = await lstat(dir);
  if (!stats.isDirectory() || stats.isSymbolicLink()) throw new Error('invalid_storage_directory');
  await chmod(dir, 0o700);
  const temporary = join(dir, `.${draft.id}.${randomUUID()}.tmp`);
  const destination = join(dir, `${draft.id}.json`);
  let handle;
  try {
    handle = await open(temporary, 'wx', 0o600);
    await handle.writeFile(JSON.stringify(draft, null, 2), 'utf8');
    await handle.sync();
    await handle.close(); handle = undefined;
    await rename(temporary, destination);
    return draft;
  } catch (error) {
    await handle?.close().catch(() => {});
    await unlink(temporary).catch(() => {});
    throw error;
  }
}
