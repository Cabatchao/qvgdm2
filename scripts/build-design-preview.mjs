import { cp, mkdir, readFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';
const root = process.cwd();
const output = path.join(root, 'out-design');
for (const asset of ['images/zio-hero-v2.webp','images/zio-dining-v2.webp','images/zio-terrace-v2.webp','fonts/ProximaNova-Regular.woff2']) {
  try { await stat(path.join(root, 'public', asset)); }
  catch { throw new Error('Missing private presentation asset: ' + asset + '. See design-preview/README.md.'); }
}
await rm(output, {recursive: true, force: true});
await mkdir(output);
await cp(path.join(root, 'design-preview'), output, {recursive: true});
for (const folder of ['images','fonts','video']) await cp(path.join(root, 'public', folder), path.join(output, folder), {recursive: true});
await readFile(path.join(output, 'index.html'), 'utf8');
console.log('Static design built in ' + output);
