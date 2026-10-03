import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readCatalog } from './catalog.ts';

// Isolated fixtures: never rename, remove or change the user's actual media folders.
const fixture = mkdtempSync(path.join(tmpdir(), 'asselineau-catalog-'));
const mediaRoot = path.join(fixture, 'public/media');
mkdirSync(path.join(fixture, 'content'), { recursive: true });
mkdirSync(mediaRoot, { recursive: true });
writeFileSync(path.join(fixture, 'content/site.json'), readFileSync('content/site.json'));
const definition = {
  id: 'publication-a', title: 'Test', description: 'Fixture', date: '2026-10-03',
  type: 'image', category: 'independance', file: 'image.png', thumbnail: 'image.png',
  width: 720, height: 720, alt: 'Test', order: 20,
};
const folderA = path.join(mediaRoot, 'publication-a');
const folderB = path.join(mediaRoot, 'publication-b');
function publication(folder: string, data: unknown) {
  mkdirSync(folder, { recursive: true });
  writeFileSync(path.join(folder, 'image.png'), 'fixture');
  writeFileSync(path.join(folder, 'media.json'), JSON.stringify(data));
}
// Only remove paths verified to belong to this temporary fixture.
function remove(target: string) {
  assert(path.resolve(target).startsWith(path.resolve(fixture) + path.sep));
  rmSync(target, { recursive: true });
}
try {
  assert.equal(readCatalog(fixture).media.length, 0, 'Catalogue vide accepté');
  publication(folderA, definition);
  publication(folderB, { ...definition, id: 'publication-b', order: 10 });
  assert.deepEqual(readCatalog(fixture).media.map(item => item.id), ['publication-b', 'publication-a']);
  assert.equal(readCatalog(fixture).media[0].file, 'media/publication-b/image.png');
  remove(folderA);
  assert.deepEqual(readCatalog(fixture).media.map(item => item.id), ['publication-b'], 'Suppression sans index à nettoyer');
  publication(folderA, { ...definition, order: 10 });
  assert.deepEqual(readCatalog(fixture).media.map(item => item.id), ['publication-a', 'publication-b'], 'Ordre secondaire stable');
  publication(folderA, { ...definition, file: '../publication-b/image.png' });
  assert.throws(() => readCatalog(fixture), /media.json.*file/);
  publication(folderA, { ...definition, file: 'absent.png' });
  assert.throws(() => readCatalog(fixture), /fichier introuvable/);
  publication(folderA, { ...definition, id: 'publication-b' });
  assert.throws(() => readCatalog(fixture), /identifiant dupliqué/);
  publication(folderA, { ...definition, category: 'absente' });
  assert.throws(() => readCatalog(fixture), /catégorie inconnue/);
  writeFileSync(path.join(folderA, 'media.json'), '{');
  assert.throws(() => readCatalog(fixture), /JSON illisible/);
  remove(folderA);
  remove(folderB);
  assert.equal(readCatalog(fixture).media.length, 0);
  const incomplete = path.join(mediaRoot, 'incomplete');
  mkdirSync(incomplete);
  assert.throws(() => readCatalog(fixture), /media.json.*JSON illisible/);
  remove(incomplete);
  for (let index = 0; index < 500; index++) {
    const id = `publication-${String(index).padStart(3, '0')}`;
    publication(path.join(mediaRoot, id), { ...definition, id, order: index });
  }
  assert.equal(readCatalog(fixture).media.length, 500, 'Découverte de 500 publications');
  console.log('Catalogue vérifié : découverte, ajout, suppression, ordre, autonomie et erreurs explicites.');
} finally {
  // Remove only this known mkdtemp fixture, never a computed project path.
  assert(path.dirname(fixture) === tmpdir() && path.basename(fixture).startsWith('asselineau-catalog-'));
  rmSync(fixture, { recursive: true });
}
