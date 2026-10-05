import sharp from 'sharp';
import { mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';

const work = resolve('design/unis-pour-la-france-parallaxe');
mkdirSync(join(work, 'frames'), { recursive: true });
const source = 'C:/Users/laslite/Documents/Git/fastDVDNet/comic-workflow/asselineau-unis-pour-la-france.png';
copyFileSync(source, join(work, 'original.png'));
const width = 720, height = 900, fps = 10, count = 60;
const raw = { width, height, channels: 3 };
const original = await sharp(source).resize(width, height).removeAlpha().raw().toBuffer();
const generated = await sharp(join(work, 'fond-reconstitue.png')).resize(width, height, { fit: 'fill' }).removeAlpha().raw().toBuffer();
// Coordinates in the original 1122 x 1402 poster. The entire silhouette is rigid.
const silhouette = '500,462 495,428 490,393 496,356 514,326 539,308 570,306 604,311 625,327 639,353 642,381 638,413 624,444 641,471 674,485 692,508 706,551 714,613 728,686 731,757 741,832 752,901 749,941 752,969 742,990 718,1000 700,992 704,953 694,942 688,1001 686,1095 398,1095 411,1052 408,1007 401,963 377,951 351,929 357,891 370,844 383,795 388,754 386,728 362,722 341,709 328,687 318,658 321,620 331,585 347,551 374,524 408,505 449,484';
const svg = `<svg width="${width}" height="${height}" viewBox="0 0 1122 1402"><polygon points="${silhouette}" fill="white"/></svg>`;
// Include a small safety margin around hair, lapels and fingers so no edge moves.
const mask = await sharp(Buffer.from(svg)).ensureAlpha().extractChannel(3).blur(5).threshold(1).raw().toBuffer();
const clean = Buffer.from(original);
for (let p = 0; p < width * height; p++) {
  const a = mask[p] / 255;
  for (let c = 0; c < 3; c++) clean[p * 3 + c] = Math.round(original[p * 3 + c] * (1 - a) + generated[p * 3 + c] * a);
}
await sharp(clean, { raw }).png().toFile(join(work, 'fond-compose.png'));
await sharp(mask, { raw: { width, height, channels: 1 } }).png().toFile(join(work, 'masque-personnage.png'));
const clamp = x => Math.max(0, Math.min(1, x));
const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
let maxProtectedDifference = 0;
for (let frame = 0; frame < count; frame++) {
  const out = Buffer.from(original);
  // Camera travels in one direction only. Distant scenery shifts less than the city.
  const t = frame / (count - 1);
  for (let y = 0; y < height; y++) {
    const sy = y * 1402 / height;
    const vertical = smooth((sy - 185) / 30) * smooth((1090 - sy) / 30);
    const city = smooth((sy - 620) / 200);
    const shift = (0.5 - t) * (8 + 10 * city);
    // Walls including their lettering and all poster headings stay fixed.
    const left = (sy < 550 ? 200 + (sy - 185) * 0.33 : sy < 800 ? 320 - (sy - 550) * 0.2 : 270 + (sy - 800) * 0.1) * width / 1122;
    const right = width - left;
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      const alpha = vertical * smooth((x - left) / 22) * smooth((right - x) / 22) * (1 - mask[p] / 255);
      if (!alpha) continue;
      const sample = Math.max(0, Math.min(width - 1.001, x - shift));
      const x0 = Math.floor(sample), mix = sample - x0;
      for (let c = 0; c < 3; c++) {
        const value = clean[(y * width + x0) * 3 + c] * (1 - mix) + clean[(y * width + x0 + 1) * 3 + c] * mix;
        out[p * 3 + c] = Math.round(original[p * 3 + c] * (1 - alpha) + value * alpha);
      }
    }
  }
  for (let p = 0; p < width * height; p++) {
    const y = Math.floor(p / width) * 1402 / height;
    if (mask[p] === 255 || y < 185 || y >= 1090) {
      for (let c = 0; c < 3; c++) maxProtectedDifference = Math.max(maxProtectedDifference, Math.abs(out[p * 3 + c] - original[p * 3 + c]));
    }
  }
  await sharp(out, { raw }).png().toFile(join(work, 'frames', `${String(frame).padStart(3, '0')}.png`));
}
const input = join(work, 'frames', '%03d.png');
const run = args => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { windowsHide: true });
run(['-framerate', String(fps), '-i', input, '-an', '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', join(work, 'parallaxe.mp4')]);
run(['-framerate', String(fps), '-i', input, '-filter_complex', 'scale=480:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle', '-loop', '0', join(work, 'parallaxe.gif')]);
writeFileSync(join(work, 'verification.json'), JSON.stringify({ width, height, fps, frames: count, duration: count / fps, maxProtectedDifference, note: 'Comparison before lossy video/GIF encoding. Camera travels left to right, reset at loop boundary.' }, null, 2));
console.log(JSON.stringify({ work, maxProtectedDifference }));
