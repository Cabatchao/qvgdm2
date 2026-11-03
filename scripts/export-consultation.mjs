import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readdir, rename, rm, writeFile, readFile, cp } from 'node:fs/promises';
import path from 'node:path';
import { JSDOM } from 'jsdom';

// A read-only export of the closed-intake production build, never a lead receiver.
const [base, output] = process.argv.slice(2);
if (!base || !output) throw new Error('Usage: node scripts/export-consultation.mjs http://127.0.0.1:PORT /absolute/output');
const origin = new URL(base);
if (origin.protocol !== 'http:' || origin.hostname !== '127.0.0.1' || origin.pathname !== '/' || origin.username || origin.password || origin.search || origin.hash || !path.isAbsolute(output)) {
  throw new Error('A loopback HTTP origin and absolute output directory are required.');
}
// Generate beside the target so an interrupted run cannot publish half an export.
// rename() also refuses to replace a nonempty directory if two jobs race.
await mkdir(path.dirname(output), { recursive: true });
let entries;
try { entries = await readdir(output); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
if (entries?.length) throw new Error('Export destination must be empty. Choose a new directory.');
const staging = await mkdtemp(path.join(path.dirname(output), '.zio-export-'));
try {
  const stylesheets = await writeExport(staging);
  await rename(staging, output);
  console.log(JSON.stringify({ routes: 3, stylesheets, applicationJavaScript: false, collection: false, output }));
} finally {
  await rm(staging, { recursive: true, force: true });
}

async function writeExport(output) {
  const assets = new Set();
  const policy = "default-src 'none'; style-src 'self'; img-src 'self' data:; font-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'; connect-src 'none'";
  for (const route of ['/', '/confidentialite', '/mentions-legales']) {
    const response = await fetch(new URL(route, origin), { redirect: 'error' });
    if (!response.ok) throw new Error(`${route}: HTTP ${response.status}`);
    const dom = new JSDOM(await response.text());
    const document = dom.window.document;
    if (document.querySelector('form')) throw new Error('Refusing to export an open intake form.');
    if (route === '/' && !document.body.textContent.includes('Le formulaire de cette page est en préparation.')) {
      throw new Error('Closed-intake notice missing.');
    }
    for (const node of document.querySelectorAll('script, link[as="script"], link[rel="modulepreload"]')) node.remove();
    for (const node of document.querySelectorAll('[nonce]')) node.removeAttribute('nonce');
    for (const link of document.querySelectorAll('link[rel="stylesheet"]')) {
      const url = new URL(link.getAttribute('href'), origin);
      if (url.origin !== origin.origin || !/^\/_next\/static\/[a-zA-Z0-9_./-]+\.css$/.test(url.pathname)) throw new Error('Unexpected stylesheet');
      assets.add(url.pathname);
    }
    const hasFilm = Boolean(document.querySelector('video[data-hero-video]'));
    let pagePolicy = policy;
    if (hasFilm) {
      const code = await readFile('public/presentation.js', 'utf8');
      const script = document.createElement('script');
      script.id = 'zio-presentation';
      script.textContent = code;
      document.body.append(script);
      const digest = createHash('sha256').update(code).digest('base64');
      pagePolicy += "; media-src 'self'; script-src 'sha256-" + digest + "'";
      await mkdir(path.join(output, 'video'), { recursive: true });
      await cp('public/video/zio-cuisine.mp4', path.join(output, 'video/zio-cuisine.mp4'));
    }
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = pagePolicy;
    document.head.prepend(meta);
    const destination = path.join(output, route === '/' ? '' : route.slice(1));
    await mkdir(destination, { recursive: true });
    await writeFile(path.join(destination, 'index.html'), dom.serialize());
  }
  for (const asset of assets) {
    const response = await fetch(new URL(asset, origin), { redirect: 'error' });
    if (!response.ok) throw new Error(`${asset}: HTTP ${response.status}`);
    const destination = path.join(output, asset.slice(1));
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, await response.text());
  }
  await writeFile(path.join(output, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
  for (const directory of ['images', 'fonts']) {
    await cp(path.join(process.cwd(), 'public', directory), path.join(output, directory), { recursive: true });
  }
  return assets.size;
}
