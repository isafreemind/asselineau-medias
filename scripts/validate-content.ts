import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync, openSync, readSync, closeSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import sharp from 'sharp';
import { orientation, ratio, type SiteContent } from '../src/schema';
import { publicFile, publicDir, folderSize, readContent } from './shared';

const errors: string[] = [];
const warnings: string[] = [];
const records: Record<string, unknown>[] = [];
let content: SiteContent;
try { content = readContent(); }
catch (error) { console.error(`ERREUR : ${error instanceof Error ? error.message : String(error)}`); process.exit(1); }
const ids = new Set<string>();
const categories = new Set<string>();
for (const category of content.categories) {
  if (categories.has(category.id)) errors.push(`Catégorie dupliquée : ${category.id}`);
  categories.add(category.id);
}
let ffprobeAvailable = true;
try { execFileSync('ffprobe', ['-version'], {stdio: 'ignore', windowsHide: true}); } catch { ffprobeAvailable = false; }
const x = content.validationRules.x;
const rulesAge = (Date.now() - new Date(`${content.validationRules.checkedOn}T00:00:00Z`).getTime()) / 86400000;
if (rulesAge > 90) warnings.push('Les règles X datent de plus de 90 jours. Vérifier les sources officielles et mettre à jour validationRules.checkedOn.');

async function inspect(file: string, label: string, kind: string, width: number, height: number) {
  const target = publicFile(file);
  if (!existsSync(target)) { errors.push(`${label} : fichier introuvable (${file}).`); return; }
  const sizeMb = statSync(target).size / 1_000_000;
  const extension = path.extname(file).slice(1).toLowerCase();
  const descriptor = openSync(target, 'r');
  const header = Buffer.alloc(120);
  try { readSync(descriptor, header, 0, header.length, 0); } finally { closeSync(descriptor); }
  const head = header.toString('utf8');
  if (head.startsWith('version https://git-lfs.github.com/spec/')) { errors.push(`${label} : pointeur LFS non récupéré. Exécuter git lfs pull.`); return; }
  try {
    if (kind === 'image' || kind === 'gif' || kind === 'thumbnail') {
      const meta = await sharp(target, {animated: false}).metadata();
      if (kind !== 'thumbnail' && (meta.width !== width || meta.height !== height)) errors.push(`${label} : dimensions réelles ${meta.width} × ${meta.height}, JSON ${width} × ${height}. Corriger le JSON.`);
      const extensions: Record<string, string[]> = {jpeg: ['jpg', 'jpeg'], png: ['png'], gif: ['gif'], webp: ['webp'], svg: ['svg'], avif: ['avif']};
      if (!extensions[meta.format || '']?.includes(extension)) errors.push(`${label} : extension ${extension} incompatible avec le format détecté ${meta.format}.`);
      if (kind === 'gif' && meta.format !== 'gif') errors.push(`${label} : type GIF déclaré mais fichier ${meta.format}.`);
      if (kind === 'image' && !['jpeg', 'png', 'gif'].includes(meta.format || '')) warnings.push(`${label} : convertir en PNG ou JPEG pour publier directement sur X.`);
      if (kind === 'image' && sizeMb > x.imageMaxMb) warnings.push(`${label} : ${sizeMb.toFixed(2)} Mo, au-delà du seuil image X (${x.imageMaxMb} Mo).`);
      if (kind === 'gif' && sizeMb > x.gifWebMaxMb) warnings.push(`${label} : GIF trop lourd pour X sur le Web (${x.gifWebMaxMb} Mo).`);
      else if (kind === 'gif' && sizeMb > x.gifMobileMaxMb) warnings.push(`${label} : GIF trop lourd pour X sur mobile (${x.gifMobileMaxMb} Mo).`);
      if (kind !== 'thumbnail' && Math.min(width, height) < 480) warnings.push(`${label} : faible définition. Préférer une largeur ou hauteur courte de 720 pixels ou plus si la source le permet.`);
      if (kind === 'thumbnail' && (meta.width || 0) < 300) warnings.push(`${label} : miniature de faible définition pour un aperçu social.`);
      records.push({file, format: meta.format, width: meta.width, height: meta.height, sizeMb});
    } else {
      if (!ffprobeAvailable) { errors.push(`${label} : ffprobe requis pour vérifier ce fichier audiovisuel. Installer FFmpeg.`); return; }
      const info = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', target], {encoding: 'utf8', windowsHide: true, maxBuffer: 10_000_000})) as {format: {duration: string; bit_rate?: string; format_name: string}; streams: {codec_type: string; codec_name: string; width?: number; height?: number; avg_frame_rate?: string}[]};
      const video = info.streams.find(stream => stream.codec_type === 'video');
      const audio = info.streams.find(stream => stream.codec_type === 'audio');
      if (kind === 'video' && !video) errors.push(`${label} : aucune piste vidéo détectée.`);
      if (kind === 'audio' && !audio) errors.push(`${label} : aucune piste audio détectée.`);
      if (kind === 'video' && video && (video.width !== width || video.height !== height)) errors.push(`${label} : dimensions vidéo ${video.width} × ${video.height}, JSON ${width} × ${height}.`);
      if (kind === 'video') {
        if (!['mp4', 'webm', 'mov'].includes(extension)) warnings.push(`${label} : format peu compatible avec les navigateurs. Fournir un MP4 H.264/AAC.`);
        if (extension !== 'mp4' || video?.codec_name !== 'h264' || (audio && audio.codec_name !== 'aac')) warnings.push(`${label} : préférer MP4 / H.264 / AAC pour une publication sur X et une lecture largement compatible.`);
        if (Number(info.format.duration) > x.videoMaxSeconds) warnings.push(`${label} : durée ${Number(info.format.duration).toFixed(1)} s supérieure à ${x.videoMaxSeconds} s pour un compte X sans Premium.`);
        if (sizeMb > x.videoMaxMb) warnings.push(`${label} : poids supérieur à ${x.videoMaxMb} Mo pour un compte X sans Premium.`);
        const aspect = width / height;
        if (aspect < 1 / 2.39 || aspect > 2.39) warnings.push(`${label} : ratio hors de la plage vidéo X. Fournir une variante 16:9, 1:1, 4:5 ou 9:16 avec marges si nécessaire.`);
      }
      records.push({file, sizeMb, duration: Number(info.format.duration), container: info.format.format_name, streams: info.streams, bitrate: info.format.bit_rate});
    }
  } catch (error) { errors.push(`${label} : fichier illisible ou format invalide (${String(error)}).`); }
}

for (const [index, media] of content.media.entries()) {
  const label = `media[${index}] (${media.id})`;
  if (ids.has(media.id)) errors.push(`${label} : identifiant dupliqué.`);
  ids.add(media.id);
  if (!categories.has(media.category)) errors.push(`${label}.category : catégorie inconnue (${media.category}).`);
  await inspect(media.file, `${label}.file`, media.type, media.width, media.height);
  await inspect(media.thumbnail, `${label}.thumbnail`, 'thumbnail', media.width, media.height);
  const groupPaths = new Set([media.file]);
  for (const [partIndex, part] of media.parts.entries()) {
    if (groupPaths.has(part.file)) errors.push(`${label}.parts[${partIndex}] : fichier dupliqué dans le groupe.`);
    groupPaths.add(part.file);
    await inspect(part.file, `${label}.parts[${partIndex}].file`, part.type, part.width, part.height);
    await inspect(part.thumbnail, `${label}.parts[${partIndex}].thumbnail`, 'thumbnail', part.width, part.height);
  }
  for (const variant of media.variants) await inspect(variant.file, `${label}.variants (${variant.label})`, variant.type ?? media.type, variant.width, variant.height);
  records.push({id: media.id, orientation: orientation(media), ratio: ratio(media)});
}
const sizeMb = folderSize(publicDir) / 1_000_000;
if (sizeMb > content.validationRules.deploymentLimitMb) errors.push(`Le dossier public dépasse la limite de publication : ${sizeMb.toFixed(2)} Mo.`);
else if (sizeMb > content.validationRules.deploymentWarningMb) warnings.push(`Capacité GitHub Pages : déjà ${sizeMb.toFixed(2)} Mo avant les scripts et les aperçus sociaux.`);
mkdirSync('reports', {recursive: true});
writeFileSync('reports/media-validation.json', JSON.stringify({checkedAt: new Date().toISOString(), rules: content.validationRules, errors, warnings, publicSizeMb: sizeMb, records}, null, 2));
for (const error of errors) console.error(`ERREUR : ${error}`);
for (const warning of warnings) console.warn(`AVERTISSEMENT : ${warning}`);
console.log(`${content.media.length} médias contrôlés · ${errors.length} erreurs · ${warnings.length} avertissements · ${sizeMb.toFixed(2)} Mo.`);
if (errors.length) process.exit(1);
