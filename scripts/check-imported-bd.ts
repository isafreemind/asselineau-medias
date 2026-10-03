import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { readCatalog } from './catalog.ts';

const report = JSON.parse(readFileSync('reports/import-watermarked-bd.json', 'utf8')) as {
  records: { id: string; original: string; source: string; destination: string; bytes: number; sha256: string }[];
};
const catalog = readCatalog();
let originalBytes = 0, importedBytes = 0;
for (const record of report.records) {
  const data = readFileSync(record.destination);
  assert.equal(createHash('sha256').update(data).digest('hex'), record.sha256);
  assert.deepEqual(data, readFileSync(record.source), 'Copie différente de la sortie waternark');
  const media = catalog.media.find(item => item.id === record.id)!;
  assert(media, `Publication absente : ${record.id}`);
  assert([media, ...media.parts].some(item => path.basename(item.file) === path.basename(record.destination)), 'Page absente du JSON');
  const original = path.join(path.dirname(path.dirname(record.source)), record.original);
  originalBytes += statSync(original).size; importedBytes += data.length;
  const source = await sharp(original).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const marked = await sharp(record.destination).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(source.info.width, marked.info.width); assert.equal(source.info.height, marked.info.height);
  const { width, height, channels } = source.info;
  // Default stamp sits only in this conservative bottom-right rectangle.
  const left = Math.floor(width * 0.6), top = Math.floor(height * 0.95);
  let changed = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * channels;
      const equal = source.data.subarray(offset, offset + channels).equals(marked.data.subarray(offset, offset + channels));
      if (!equal) {
        assert(x >= left && y >= top, `Pixel hors watermark modifié : ${record.original} (${x},${y})`);
        changed++;
      }
    }
  }
  assert(changed > 0, `Watermark absent : ${record.original}`);
}
console.log(`${report.records.length} pages vérifiées : dimensions, pixels hors watermark, empreintes, copies et catalogue.`);
console.log(`Originaux ${(originalBytes / 1_000_000).toFixed(2)} Mo → copies ${(importedBytes / 1_000_000).toFixed(2)} Mo (${((1 - importedBytes / originalBytes) * 100).toFixed(1)} % de moins).`);
