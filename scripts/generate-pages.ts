import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { escapeHtml as e, readContent, publicFile, folderSize, hosting, archive } from './shared';

const content = readContent();
const {origin, base} = hosting();
const template = readFileSync('dist/index.html', 'utf8');
function head(title: string, description: string, url: string, image?: string, alt?: string) {
  return `<title>${e(title)}</title><meta name="description" content="${e(description)}"/><link rel="canonical" href="${e(url)}"/><meta property="og:type" content="website"/><meta property="og:locale" content="fr_FR"/><meta property="og:site_name" content="${e(content.site.name)}"/><meta property="og:title" content="${e(title)}"/><meta property="og:description" content="${e(description)}"/><meta property="og:url" content="${e(url)}"/><meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}"/><meta name="twitter:title" content="${e(title)}"/><meta name="twitter:description" content="${e(description)}"/>${image ? `<meta property="og:image" content="${e(image)}"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta property="og:image:alt" content="${e(alt || title)}"/><meta name="twitter:image" content="${e(image)}"/><meta name="twitter:image:alt" content="${e(alt || title)}"/>` : ''}`;
}
function page(metadata: string, fallback: string) {
  return template.replace(/<title>[\s\S]*?<\/title>/, '').replace(/<meta\s+name="description"[^>]*>/, '').replace('</head>', `${metadata}</head>`).replace('<div id="root"></div>', `<div id="root"></div><noscript>${fallback}</noscript>`);
}
mkdirSync('dist/social', {recursive: true});
mkdirSync('dist/downloads', {recursive: true});
const urls = [origin];
for (const media of content.media) {
  if (media.parts.length) writeFileSync(`dist/downloads/${media.id}.zip`, archive(media));
  const dir = path.join('dist', 'medias', media.id);
  mkdirSync(dir, {recursive: true});
  // L'aperçu social est un JPEG distinct ; le fichier original reste intact.
  await sharp(publicFile(media.thumbnail)).rotate().resize(1200, 630, {fit: 'contain', background: '#102a43'}).flatten({background: '#102a43'}).jpeg({quality: 88}).toFile(`dist/social/${media.id}.jpg`);
  const url = new URL(`medias/${media.id}/`, origin).href;
  const image = new URL(`social/${media.id}.jpg`, origin).href;
  const source = `${base}${media.file.split('/').map(encodeURIComponent).join('/')}`;
  const visual = media.type === 'video' ? `<video controls poster="${e(`${base}${media.thumbnail}`)}" src="${e(source)}"></video>` : media.type === 'audio' ? `<audio controls src="${e(source)}"></audio>` : `<img src="${e(source)}" alt="${e(media.alt)}" style="max-width:100%;max-height:80vh;object-fit:contain"/>`;
  const partsFallback = media.parts.map(part => `<p>${e(part.title)} : <a href="${e(`${base}${part.file}`)}" download>${e(content.labels.download)}</a></p>`).join('');
  const archiveLink = media.parts.length ? `<a href="${e(`${base}downloads/${media.id}.zip`)}" download>${e(content.labels.downloadGroup)}</a>` : '';
  writeFileSync(path.join(dir, 'index.html'), page(head(`${media.title} — ${content.site.name}`, media.description, url, image, media.alt), `<main><h1>${e(media.title)}</h1><p>${e(media.description)}</p>${visual}${partsFallback}${archiveLink}<p><a href="${e(source)}" download>${e(content.labels.download)}</a> · <a href="${e(base)}">${e(content.labels.back)}</a></p></main>`));
  urls.push(url);
}
const authorMessage = content.site.authorMessage;
const authorFallback = `<section><h2>${e(authorMessage.title)}</h2>${authorMessage.paragraphs.map(paragraph => `<p>${e(paragraph)}</p>`).join('')}<a href="${e(authorMessage.profileUrl)}" target="_blank" rel="noopener noreferrer">${e(authorMessage.signature)}</a></section>`;
writeFileSync('dist/index.html', page(head(content.site.name, content.site.description, origin), `<h1>${e(content.site.headline)}</h1>${authorFallback}<ul>${content.media.map(media => `<li><a href="${e(`${base}medias/${media.id}/`)}">${e(media.title)}</a></li>`).join('')}</ul>`));
writeFileSync('dist/404.html', page(head(content.labels.notFound, content.site.description, origin), `<h1>${e(content.labels.notFound)}</h1><a href="${e(base)}">${e(content.labels.back)}</a>`));
writeFileSync('dist/.nojekyll', '');
writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url => `<url><loc>${e(url)}</loc></url>`).join('')}</urlset>`);
writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${new URL('sitemap.xml', origin).href}\n`);
const sizeMb = folderSize('dist') / 1_000_000;
console.log(`${content.media.length} pages médias et aperçus sociaux générés · ${sizeMb.toFixed(2)} Mo · ${origin}`);
if (sizeMb > content.validationRules.deploymentLimitMb) throw new Error(`Publication trop volumineuse (${sizeMb.toFixed(2)} Mo).`);
if (sizeMb > content.validationRules.deploymentWarningMb) console.warn(`AVERTISSEMENT : publication proche de la limite GitHub Pages (${sizeMb.toFixed(2)} Mo).`);
