import { mkdir, writeFile, cp } from 'node:fs/promises';
import path from 'node:path';
import { JSDOM } from 'jsdom';

// A read-only export of the closed-intake production build, never a lead receiver.
const [base, output] = process.argv.slice(2);
if (!base || !output) throw new Error('Usage: node scripts/export-consultation.mjs http://127.0.0.1:PORT /absolute/output');
const origin = new URL(base);
if (origin.protocol !== 'http:' || origin.hostname !== '127.0.0.1' || origin.pathname !== '/' || origin.username || origin.password || origin.search || origin.hash || !path.isAbsolute(output)) {
  throw new Error('A loopback HTTP origin and absolute output directory are required.');
}
const assets = new Set();
const policy = "default-src 'none'; style-src 'self'; img-src 'self' data:; font-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'; connect-src 'none'";
for (const route of ['/', '/confidentialite', '/mentions-legales']) {
  const response = await fetch(new URL(route, origin), { redirect: 'error' });
  if (!response.ok) throw new Error(`${route}: HTTP ${response.status}`);
  const dom = new JSDOM(await response.text());
  const document = dom.window.document;
  if (document.querySelector('form')) throw new Error('Refusing to export an open intake form.');
  if (route === '/' && !document.body.textContent.includes('Les candidatures en ligne ne sont pas encore ouvertes.')) {
    throw new Error('Closed-intake notice missing.');
  }
  for (const node of document.querySelectorAll('script, link[as="script"], link[rel="modulepreload"]')) node.remove();
  for (const node of document.querySelectorAll('[nonce]')) node.removeAttribute('nonce');
  for (const link of document.querySelectorAll('link[rel="stylesheet"]')) {
    const url = new URL(link.getAttribute('href'), origin);
    if (url.origin !== origin.origin || !/^\/_next\/static\/[a-zA-Z0-9_./-]+\.css$/.test(url.pathname)) throw new Error('Unexpected stylesheet');
    assets.add(url.pathname);
  }
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = policy;
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
console.log(JSON.stringify({ routes: 3, stylesheets: assets.size, javascript: false, collection: false, output }));
