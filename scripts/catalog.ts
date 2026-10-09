import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { mediaDefinitionSchema, siteSettingsSchema, siteSchema, type SiteContent } from '../src/schema.ts';

function readJson<T>(file: string, schema: z.ZodType<T>): T {
  if (existsSync(file) && lstatSync(file).isSymbolicLink()) throw new Error(`${file} : définition par lien symbolique interdite.`);
  let value: unknown;
  try { value = JSON.parse(readFileSync(file, 'utf8')); }
  catch (error) { throw new Error(`${file} : JSON illisible (${String(error)}).`); }
  const result = schema.safeParse(value);
  if (!result.success) throw new Error(result.error.issues.map(issue => `${file} → ${issue.path.join('.') || 'racine'} : ${issue.message}`).join('\n'));
  return result.data;
}

/** Discover publications from immediate subdirectories, without a maintained index. */
export function readCatalog(projectRoot = process.cwd()): SiteContent {
  const settings = readJson(path.join(projectRoot, 'content/site.json'), siteSettingsSchema);
  const mediaRoot = path.join(projectRoot, 'public/media');
  if (!existsSync(mediaRoot)) return siteSchema.parse({ ...settings, media: [] });
  const categories = new Set(settings.categories.map(item => item.id));
  const ids = new Set<string>();
  const definitions = readdirSync(mediaRoot, { withFileTypes: true })
    .sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
    .filter(entry => {
      if (entry.isSymbolicLink()) throw new Error(`${path.join(mediaRoot, entry.name)} : lien symbolique interdit.`);
      return entry.isDirectory();
    }).map(entry => {
      const directory = path.join(mediaRoot, entry.name);
      const metadataFile = path.join(directory, 'media.json');
      const media = readJson(metadataFile, mediaDefinitionSchema);
      if (ids.has(media.id)) throw new Error(`${metadataFile} → id : identifiant dupliqué (${media.id}).`);
      ids.add(media.id);
      if (!categories.has(media.category)) throw new Error(`${metadataFile} → category : catégorie inconnue (${media.category}).`);
      const folder = realpathSync(directory);
      const resolveFile = (file: string, field: string) => {
        const target = path.resolve(directory, file);
        if (!target.startsWith(path.resolve(directory) + path.sep)) throw new Error(`${metadataFile} → ${field} : fichier hors de la publication.`);
        if (!existsSync(target) || !lstatSync(target).isFile()) throw new Error(`${metadataFile} → ${field} : fichier introuvable (${file}).`);
        if (!realpathSync(target).startsWith(folder + path.sep)) throw new Error(`${metadataFile} → ${field} : dépendance hors du dossier interdite.`);
        return `media/${entry.name}/${file}`;
      };
      return {
        ...media,
        file: resolveFile(media.file, 'file'),
        thumbnail: resolveFile(media.thumbnail, 'thumbnail'),
        parts: media.parts.map((part, index) => ({ ...part, file: resolveFile(part.file, `parts.${index}.file`), thumbnail: resolveFile(part.thumbnail, `parts.${index}.thumbnail`) })),
        variants: media.variants.map((variant, index) => ({ ...variant, file: resolveFile(variant.file, `variants.${index}.file`) })),
      };
    });
  definitions.sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0)
    || a.order - b.order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return siteSchema.parse({ ...settings, media: definitions });
}
