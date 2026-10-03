import { mkdirSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

mkdirSync('public/media', {recursive: true});
const demoFolders: Record<string, string> = {
  horizontal: 'souverainete-democratie',
  carre: 'decider-nous-memes',
  portrait: 'patrimoine-francais',
  vertical: 'une-minute-pour-comprendre',
  animation: 'liberte-independance',
};
const demoFile = (name: string, extension: string) => `public/media/${demoFolders[name]}/exemple-${name}.${extension}`;
for (const folder of Object.values(demoFolders)) mkdirSync(`public/media/${folder}`, {recursive: true});
const examples = [
  {name: 'horizontal', width: 1280, height: 720, lines: ['LA SOUVERAINETÉ', 'condition de', 'la démocratie.'], colour: '#102a43'},
  {name: 'carre', width: 1080, height: 1080, lines: ['DÉCIDER', 'NOUS-MÊMES.'], colour: '#315a8a'},
  {name: 'portrait', width: 1080, height: 1350, lines: ['UN HÉRITAGE.', 'UN AVENIR', 'COMMUN.'], colour: '#896e38'},
  {name: 'vertical', width: 720, height: 1280, lines: ['COMPRENDRE.', 'DÉCIDER.', 'AGIR.'], colour: '#b62832'}
];
for (const item of examples) {
  const font = item.width * .065;
  const start = item.height * .4;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${item.width}" height="${item.height}"><rect width="100%" height="100%" fill="${item.colour}"/><rect x="${item.width * .06}" y="${item.height * .06}" width="${item.width * .88}" height="${item.height * .88}" rx="8" stroke="#ffffff50" fill="none"/><text x="50%" y="18%" text-anchor="middle" font-family="Georgia" font-size="${font * .35}" letter-spacing="4" fill="#f7f3e8">LA FRANCE INDÉPENDANTE</text>${item.lines.map((line, index) => `<text x="50%" y="${start + index * font * 1.35}" text-anchor="middle" font-family="Georgia" font-size="${font}" fill="#f7f3e8">${line}</text>`).join('')}<rect x="35%" y="78%" width="10%" height="5" fill="#315a8a"/><rect x="45%" y="78%" width="10%" height="5" fill="#fff"/><rect x="55%" y="78%" width="10%" height="5" fill="#b62832"/><text x="50%" y="89%" text-anchor="middle" font-family="Arial" font-size="${font * .28}" fill="#ffffffb0">CONTENU DE DÉMONSTRATION</text></svg>`;
  await sharp(Buffer.from(svg)).png().toFile(demoFile(item.name, 'png'));
}
for (const name of ['horizontal', 'vertical']) execFileSync('ffmpeg', ['-y', '-loop', '1', '-i', demoFile(name, 'png'), '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100', '-t', '3', '-c:v', 'libx264', '-tune', 'stillimage', '-pix_fmt', 'yuv420p', '-r', '25', '-c:a', 'aac', '-movflags', '+faststart', demoFile(name, 'mp4')], {stdio: 'ignore', windowsHide: true});
execFileSync('ffmpeg', ['-y', '-loop', '1', '-i', demoFile('carre', 'png'), '-t', '2', '-vf', 'scale=540:540,fade=t=in:st=0:d=1', '-r', '8', '-loop', '0', demoFile('animation', 'gif')], {stdio: 'ignore', windowsHide: true});
console.log('Exemples PNG, vidéos MP4 et animation GIF créés.');
// Each publication owns its files: no cross-directory dependency, even in examples.
copyFileSync(demoFile('carre', 'png'), 'public/media/liberte-independance/exemple-carre.png');
mkdirSync('public/media/bd-exemple', {recursive: true});
for (const [index, name] of ['portrait', 'carre', 'vertical'].entries()) {
  copyFileSync(demoFile(name, 'png'), `public/media/bd-exemple/planche-0${index + 1}.png`);
}
