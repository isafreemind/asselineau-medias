import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { unzipSync } from 'fflate';
import sharp from 'sharp';
import path from 'node:path';
import { readContent, publicFile, hosting, escapeHtml, folderSize } from './shared';

const content = readContent();
assert.deepEqual(existsSync('dist/medias') ? readdirSync('dist/medias').sort() : [], content.media.map(item => item.id).sort(), 'Pages obsolètes ou manquantes dans le catalogue construit');
const {origin, base} = hosting();
const homeHtml = readFileSync('dist/index.html', 'utf8');
if (content.site.socialImage) {
  assert(homeHtml.includes(`property="og:image" content="${escapeHtml(new URL(content.site.socialImage, origin).href)}"`), 'Miniature sociale du site absente');
  assert(homeHtml.includes('name="twitter:card" content="summary_large_image"'), 'Carte X du site absente');
  const cover = await sharp(publicFile(content.site.socialImage)).metadata();
  assert.equal(cover.width, 1200);
  assert.equal(cover.height, 630);
}
for (const paragraph of content.site.authorMessage.paragraphs) assert(homeHtml.includes(escapeHtml(paragraph)), 'Texte de présentation absent du HTML statique');
assert(homeHtml.includes(`href="${escapeHtml(content.site.authorMessage.profileUrl)}"`), 'Lien vers le compte X absent');
for (const media of content.media) {
  const html = readFileSync(`dist/medias/${media.id}/index.html`, 'utf8');
  const url = new URL(`medias/${media.id}/`, origin).href;
  assert(html.includes(`<link rel="canonical" href="${escapeHtml(url)}"`), `${media.id} : adresse canonique incorrecte`);
  assert(html.includes(`content="${escapeHtml(media.description)}"`), `${media.id} : description sociale absente`);
  assert(html.includes(escapeHtml(new URL(`social/${media.id}.jpg`, origin).href)), `${media.id} : miniature sociale incorrecte`);
  assert(html.includes('name="twitter:card" content="summary_large_image"'), `${media.id} : carte X absente`);
  const image = await sharp(`dist/social/${media.id}.jpg`).metadata();
  assert.equal(image.width, 1200);
  assert.equal(image.height, 630);
  for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    const reference = match[1];
    if (reference.startsWith(base) && !reference.startsWith('http')) assert(existsSync(path.join('dist', reference.slice(base.length))), `Référence locale absente : ${reference}`);
  }
  if (media.parts.length) {
    const entries = unzipSync(readFileSync(`dist/downloads/${media.id}.zip`));
    assert.equal(Object.keys(entries).length, media.parts.length + 1);
    for (const [index, part] of [media, ...media.parts].entries()) {
      const filename = `${String(index + 1).padStart(3, '0')}-${path.basename(part.file)}`;
      assert.deepEqual(Buffer.from(entries[filename]), readFileSync(publicFile(part.file)), `${media.id} : fichier modifié dans le ZIP`);
    }
  }
}
assert(existsSync('dist/.nojekyll'));
assert(existsSync('dist/404.html'));
assert(folderSize('dist') / 1_000_000 <= content.validationRules.deploymentLimitMb);
console.log(`${content.media.length} pages statiques vérifiées : liens, métadonnées, aperçus sociaux et archives intacts.`);
