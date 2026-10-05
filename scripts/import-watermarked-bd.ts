/** One-shot local import. The site reads only each autonomous media.json afterwards. */
import { copyFileSync, existsSync, mkdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { z } from 'zod';
import { mediaDefinitionSchema } from '../src/schema.ts';

const config = z.object({
  date: z.iso.date(),
  publications: z.array(z.object({
    input: z.string().min(1), id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().min(1), description: z.string().min(1), category: z.string().min(1),
    tags: z.array(z.string()), pages: z.array(z.tuple([z.string(), z.string()])).min(1),
  })).min(1),
}).parse(JSON.parse(readFileSync('tools/watermark/import-bd.json', 'utf8')));
const listed = new Set(readFileSync('tools/watermark/inputs-bd.txt', 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)
  .map(line => line.trim().replace(/^"|"$/g, '')).filter(line => line && !line.startsWith('#'))
  .map(line => path.resolve(line).toLowerCase()));
const mediaRoot = path.resolve('public/media');
const ids = new Set<string>();
const plans = config.publications.map(publication => {
  if (ids.has(publication.id)) throw new Error(`Identifiant répété : ${publication.id}`);
  ids.add(publication.id);
  const input = path.resolve(publication.input);
  if (!listed.has(input.toLowerCase())) throw new Error(`Source absente de inputs-bd.txt : ${input}`);
  const sourceRoot = statSync(input).isDirectory() ? input : path.dirname(input);
  const output = path.join(sourceRoot, 'waternark');
  const destination = path.join(mediaRoot, publication.id);
  // Never overwrite hand-edited metadata or prior imports.
  if (existsSync(destination)) throw new Error(`Publication déjà présente, import refusé : ${destination}`);
  const files = new Set<string>();
  const pages = publication.pages.map(([original, title]) => {
    if (path.basename(original) !== original) throw new Error(`Nom de fichier non local : ${original}`);
    if (files.has(original)) throw new Error(`Planche répétée : ${original}`);
    files.add(original);
    const candidates = ['webp', 'png'].map(ext => path.join(output, `${original}.watermark.${ext}`)).filter(existsSync);
    if (candidates.length !== 1) throw new Error(`Une seule copie watermarquée requise pour ${original} (${candidates.length} trouvées)`);
    const source = candidates[0];
    if (!realpathSync(source).startsWith(realpathSync(output) + path.sep)) throw new Error(`Copie hors dossier : ${source}`);
    return { original, title, source };
  });
  return { publication, destination, pages };
});

// Preflight all images before creating any publication.
const prepared = await Promise.all(plans.map(async plan => ({ ...plan, pages: await Promise.all(plan.pages.map(async page => {
  const metadata = await sharp(page.source).metadata();
  if (!metadata.width || !metadata.height || (metadata.pages ?? 1) > 1) throw new Error(`Image invalide : ${page.source}`);
  return { ...page, width: metadata.width, height: metadata.height };
})) })));
const records: unknown[] = [];
let bytes = 0, count = 0;
for (const [index, plan] of prepared.entries()) {
  mkdirSync(plan.destination, { recursive: true });
  const parts = [];
  for (const [pageIndex, page] of plan.pages.entries()) {
    const file = `${path.parse(page.original).name}${path.extname(page.source)}`;
    const target = path.join(plan.destination, file);
    copyFileSync(page.source, target);
    const thumbnail = `${path.parse(file).name}-apercu.webp`;
    await sharp(target).resize({ width: 480, withoutEnlargement: true }).webp({ quality: 85 }).toFile(path.join(plan.destination, thumbnail));
    parts.push({ title: page.title, type: 'image' as const, file, thumbnail, width: page.width, height: page.height,
      alt: `${plan.publication.title} - page ${pageIndex + 1}/${plan.pages.length} : ${page.title}. Watermark @Be_Free_Mind.` });
    const data = readFileSync(target);
    bytes += data.length; count++;
    records.push({ id: plan.publication.id, original: page.original, source: page.source, destination: target,
      bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') });
  }
  const [first, ...remaining] = parts;
  const { input: _input, pages: _pages, ...editorial } = plan.publication;
  const definition = mediaDefinitionSchema.parse({ ...editorial, date: config.date, ...first,
    title: editorial.title, parts: remaining, order: 100 + index * 10 });
  writeFileSync(path.join(plan.destination, 'media.json'), JSON.stringify(definition, null, 2) + '\n');
  console.log(`${definition.id} : ${parts.length} page(s)`);
}
mkdirSync('reports', { recursive: true });
writeFileSync('reports/import-watermarked-bd.json', JSON.stringify({ date: config.date, publications: plans.length,
  pages: count, mediaBytes: bytes, dateMeaning: 'Date d’import dans cette médiathèque, pas date de création des œuvres.',
  excluded: ['Archives et sous-dossiers : watermark exécuté avec --recursive=false.', 'Visibilité : copie en double de la troisième planche, non importée.'], records }, null, 2) + '\n');
console.log(`${plans.length} publications, ${count} pages, ${(bytes / 1_000_000).toFixed(2)} Mo de médias. Copies identiques aux sorties waternark/.`);
