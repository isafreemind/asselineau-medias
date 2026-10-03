/** 2.5D horizontal camera loop from an original photo, aligned depth and clean plates. */
import sharp from 'sharp';
import { mkdirSync, existsSync, statSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const work = join(root, 'design/asselineau-parallaxe');
const source = join(root, 'public/media/asselineau-2027/asselineau-affiche.jpg');
const frames = join(work, 'frames');
mkdirSync(frames, { recursive: true });
for (const name of ['fond.png', 'profondeur-complete.png', 'portrait-sans-textes.png']) {
  if (!existsSync(join(work, name))) throw new Error(`Calque absent : ${name}`);
}
const metadata = await sharp(source).metadata();
if (!metadata.width || !metadata.height) throw new Error('Dimensions de la source absentes.');
const width = 720;
const height = Math.round(width * metadata.height / metadata.width);
const fps = 20, frameCount = 80;
const rgba = { width, height, channels: 4 as const };
const original = await sharp(source).resize(width, height).ensureAlpha().raw().toBuffer();
const clean = await sharp(join(work, 'portrait-sans-textes.png')).resize(width, height, { fit: 'fill' }).ensureAlpha().raw().toBuffer();
const depth = await sharp(join(work, 'profondeur-complete.png')).resize(width, height, { fit: 'fill' }).greyscale().blur(14).raw().toBuffer();
const background = await sharp(join(work, 'fond.png')).resize(width, height, { fit: 'fill' }).png().toBuffer();
const smooth = (v: number) => { const c = Math.max(0, Math.min(1, v)); return c * c * (3 - 2 * c); };

// Source face pixels only; reconstructed clothing texture only below the printed graphics.
const subject = Buffer.from(original);
const boundaries: [number, number][] = [];
const isTeal = (x: number, y: number) => {
  const p = (y * width + x) * 4;
  return original[p + 1] > 40 && original[p + 1] > original[p] * 1.25 + 8 && original[p + 2] > original[p] * 1.15 + 6;
};
for (let y = 0; y < height; y++) {
  let left = 0, right = width - 1;
  if (y / height < 0.64) {
    left = Math.floor(width * 0.06);
    const touchesLeft = y / height > 0.60 && !isTeal(5, y);
    let run = 0;
    for (let x = left; x < width / 2; x++) {
      run = isTeal(x, y) ? 0 : run + 1;
      if (run === 6) { left = x - 5; break; }
    }
    if (touchesLeft) left = 0;
    run = 0;
    for (let x = right; x > width / 2; x--) {
      run = isTeal(x, y) ? 0 : run + 1;
      if (run === 6) { right = x + 5; break; }
    }
  }
  boundaries.push([left, right]);
}
for (let y = 0; y < height; y++) {
  let left = 0, right = 0, count = 0;
  for (let dy = -8; dy <= 8; dy++) {
    if (y + dy < 0 || y + dy >= height) continue;
    left += boundaries[y + dy][0]; right += boundaries[y + dy][1]; count++;
  }
  left /= count; right /= count;
  const bodyBlend = smooth((y / height - 0.628) / 0.022);
  for (let x = 0; x < width; x++) {
    const p = (y * width + x) * 4;
    const veil = smooth((y / height - 0.745) / 0.055);
    const darkening = [0.35, 0.47, 0.49];
    for (let c = 0; c < 3; c++) {
      const clothing = clean[p + c] * (1 - veil * (1 - darkening[c]));
      subject[p + c] = Math.round(original[p + c] * (1 - bodyBlend) + clothing * bodyBlend);
    }
    const alphaLeft = left < 1 ? 1 : smooth((x - left + 1.5) / 3);
    const alphaRight = right > width - 2 ? 1 : smooth((right - x + 1.5) / 3);
    subject[p + 3] = Math.round(255 * alphaLeft * alphaRight);
  }
}
// Extend surface depth past its contour so background black never folds the silhouette.
for (let y = 0; y < height; y++) {
  const left = Math.min(width - 1, Math.ceil(boundaries[y][0] + 9));
  const right = Math.max(0, Math.floor(boundaries[y][1] - 9));
  const zl = depth[y * width + left], zr = depth[y * width + right];
  for (let x = 0; x < left; x++) depth[y * width + x] = zl;
  for (let x = right + 1; x < width; x++) depth[y * width + x] = zr;
}
await sharp(subject, { raw: rgba }).png().toFile(join(work, 'portrait-original-detoure.png'));

// Freeze printed glyphs, not the whole torso; preserve banner, QR and legal mentions.
const glyphMask = Buffer.alloc(width * height);
const region = (x: number, y: number, x1: number, y1: number, x2: number, y2: number) => x >= x1 && x <= x2 && y >= y1 && y <= y2;
for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
  const nx = x / width, ny = y / height, p = (y * width + x) * 4;
  const r = original[p], g = original[p + 1], b = original[p + 2];
  const white = Math.min(r, g, b) > 175 && Math.max(r, g, b) - Math.min(r, g, b) < 40;
  const yellow = r > 130 && g > 130 && b < Math.min(r, g) * 0.66;
  const yellowZone = region(nx, ny, 0.76, 0.771, 0.91, 0.803) || region(nx, ny, 0.095, 0.785, 0.76, 0.861);
  const whiteZone = region(nx, ny, 0.31, 0.855, 0.895, 0.914) || region(nx, ny, 0.04, 0.934, 0.852, 0.973) || region(nx, ny, 0.91, 0.704, 1, 0.745);
  if ((yellow && yellowZone) || (white && whiteZone)) glyphMask[y * width + x] = 255;
}
const overlayPixels = Buffer.from(original);
for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
  const nx = x / width, ny = y / height;
  let a = 0;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (x + dx >= 0 && x + dx < width && y + dy >= 0 && y + dy < height) a = Math.max(a, glyphMask[(y + dy) * width + x + dx]);
  }
  if (region(nx, ny, 0.076, 0.661, 0.951, 0.783) || region(nx, ny, 0.883, 0.907, 0.972, 0.981) || region(nx, ny, 0.921, 0.710, 0.999, 0.746)) a = 255;
  a = Math.max(a, Math.round(255 * (1 - smooth((nx - 0.037) / 0.007))));
  overlayPixels[(y * width + x) * 4 + 3] = a;
}
const overlay = await sharp(overlayPixels, { raw: rgba }).png().toBuffer();
await sharp(overlay).toFile(join(work, 'textes-statiques.png'));

function sample(data: Buffer, x: number, y: number, channels: number, c = 0) {
  x = Math.max(0, Math.min(width - 1, x)); y = Math.max(0, Math.min(height - 1, y));
  const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(width - 1, x0 + 1), y1 = Math.min(height - 1, y0 + 1);
  const fx = x - x0, fy = y - y0;
  const a = data[(y0 * width + x0) * channels + c] * (1 - fx) + data[(y0 * width + x1) * channels + c] * fx;
  const b = data[(y1 * width + x0) * channels + c] * (1 - fx) + data[(y1 * width + x1) * channels + c] * fx;
  return a * (1 - fy) + b * fy;
}

// Inverse depth reprojection avoids holes: nose, ears and chest shift independently.
function project(camera: number) {
  const result = Buffer.alloc(original.length);
  const perspective = Math.cos(camera * 0.085), scale = 1.016;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const sy = (y - height * 0.43) / scale + height * 0.43;
    const baseX = (x - width / 2) / (scale * perspective) + width / 2;
    let sx = baseX;
    for (let iteration = 0; iteration < 4; iteration++) {
      const z = Math.max(0.22, sample(depth, sx, sy, 1) / 255);
      sx = baseX + camera * (z - 0.58) * 32;
    }
    const p = (y * width + x) * 4;
    for (let c = 0; c < 4; c++) result[p + c] = Math.round(sample(subject, sx, sy, 4, c));
  }
  return result;
}
async function moveBackground(camera: number) {
  const w = Math.round(width * 1.04), h = Math.round(height * 1.04);
  return sharp(background).resize(w, h).extract({ left: Math.round((w - width) / 2 - camera * 5), top: Math.round((h - height) / 2), width, height }).png().toBuffer();
}
for (let frame = 0; frame < frameCount; frame++) {
  const camera = -Math.cos(frame / frameCount * Math.PI * 2);
  const bg = await moveBackground(camera);
  const portrait = await sharp(project(camera), { raw: rgba }).png().toBuffer();
  await sharp(bg).composite([{ input: portrait }, { input: overlay }]).png().toFile(join(frames, `${String(frame).padStart(3, '0')}.png`));
  if (frame % 20 === 0) console.log(`Images calculées : ${frame}/${frameCount}`);
}
const output = join(root, 'public/media/asselineau-2027/asselineau-parallaxe.gif');
function encode(colors: number) {
  const filter = `[0:v]split[a][b];[a]palettegen=max_colors=${colors}:reserve_transparent=0:stats_mode=full[p];[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle`;
  const run = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', String(fps), '-i', join(frames, '%03d.png'), '-filter_complex', filter, '-loop', '0', output], { encoding: 'utf8', windowsHide: true });
  if (run.error || run.status !== 0) throw new Error(run.error?.message ?? run.stderr);
}
encode(256);
if (statSync(output).size >= 10_000_000) encode(192);
if (statSync(output).size >= 10_000_000) throw new Error('GIF supérieur à 10 Mo : réduire la résolution ou la cadence.');
const report = { source: 'public/media/asselineau-2027/asselineau-affiche.jpg', output: 'public/media/asselineau-2027/asselineau-parallaxe.gif', width, height, frames: frameCount, fps, durationSeconds: frameCount / fps, loop: 'infinite', bytes: statSync(output).size, effect: '2.5D par profondeur complète, caméra gauche-droite-retour, texte fixe' };
// Validate the decoded delivery file, not just the uncompressed intermediate frames.
const gifInfo = await sharp(output, { animated: true }).metadata();
if (gifInfo.pages !== frameCount || gifInfo.loop !== 0) throw new Error('Nombre d’images ou boucle GIF incorrect.');
const first = await sharp(output, { page: 0, pages: 1 }).ensureAlpha().raw().toBuffer();
let changingFace = 0, changingBody = 0;
for (const frame of [20, 40, 60, 79]) {
  const decoded = await sharp(output, { page: frame, pages: 1 }).ensureAlpha().raw().toBuffer();
  for (let p = 0; p < width * height; p++) {
    const same = first[p * 4] === decoded[p * 4] && first[p * 4 + 1] === decoded[p * 4 + 1] && first[p * 4 + 2] === decoded[p * 4 + 2];
    if (overlayPixels[p * 4 + 3] === 255 && !same) throw new Error(`Texte ou QR mobile : image ${frame}, pixel ${p}`);
    if (!same && Math.floor(p / width) / height < 0.62) changingFace++;
    if (!same && Math.floor(p / width) / height > 0.80) changingBody++;
  }
}
if (!changingFace || !changingBody) throw new Error('Le visage ou le bas du buste ne bouge pas.');
writeFileSync(join(work, 'export.json'), JSON.stringify(report, null, 2) + '\n');
console.log('Contrôles GIF : textes et QR fixes, visage et buste mobiles, 80 images, boucle infinie.');
console.log(JSON.stringify(report, null, 2));
