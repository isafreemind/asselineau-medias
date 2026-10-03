import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { zipSync } from 'fflate';
import { readCatalog } from './catalog.ts';
import type { Media } from '../src/schema.ts';

export const root = process.cwd();
export const publicDir = path.resolve(root, 'public');
export function readContent() { return readCatalog(root); }
export function publicFile(file: string) {
  const target = path.resolve(publicDir, file);
  if (!target.startsWith(publicDir + path.sep)) throw new Error(`Chemin hors du dossier public : ${file}`);
  return target;
}
export function folderSize(dir: string): number {
  return readdirSync(dir, {withFileTypes: true}).reduce((sum, entry) => {
    const file = path.join(dir, entry.name);
    return sum + (entry.isDirectory() ? folderSize(file) : statSync(file).size);
  }, 0);
}
export function hosting() {
  const repository = process.env.GITHUB_REPOSITORY?.split('/');
  const base = repository && !repository[1].endsWith('.github.io') ? `/${repository[1]}/` : '/';
  const origin = process.env.GITHUB_PAGES_URL || (repository ? `https://${repository[0]}.github.io${base}` : 'http://localhost:5173/');
  const url = new URL(origin.endsWith('/') ? origin : `${origin}/`);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Origine de publication incorrecte.');
  return {base, origin: url.href};
}
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character]!));
}
export function archive(media: Media): Uint8Array {
  const entries: Record<string, Uint8Array> = {};
  for (const [index, item] of [media, ...media.parts].entries()) {
    // Le préfixe numérique préserve l'ordre des planches après extraction.
    entries[`${String(index + 1).padStart(3, '0')}-${path.basename(item.file)}`] = readFileSync(publicFile(item.file));
  }
  return zipSync(entries, {level: 0});
}
