import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

const run = promisify(execFile);

test('un export ne republie aucun fichier précédent et ne livre pas de version partielle', async (t) => {
  const parent = await mkdtemp(path.join(tmpdir(), 'zio-export-'));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const output = path.join(parent, 'dist');
  await mkdir(output);
  await writeFile(path.join(output, 'orphaned-debug.txt'), 'synthétique');
  let interrupt = false;
  const server = createServer((req, res) => {
    if (interrupt && req.url === '/confidentialite') {
      res.writeHead(500).end();
    } else {
      res.end('<!doctype html><html><head></head><body>Le formulaire de cette page est en préparation.</body></html>');
    }
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise<void>(resolve => server.close(() => resolve())));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const generate = () => run(process.execPath, ['scripts/export-consultation.mjs', base, output]);
  await assert.rejects(generate, /destination must be empty/);
  assert.deepEqual(await readdir(output), ['orphaned-debug.txt']);
  await rm(path.join(output, 'orphaned-debug.txt'));
  interrupt = true;
  await assert.rejects(generate, /HTTP 500/);
  assert.deepEqual(await readdir(output), []);
  assert.deepEqual(await readdir(parent), ['dist']);
  interrupt = false;
  await generate();
  assert.match(await readFile(path.join(output, 'index.html'), 'utf8'), /Content-Security-Policy/);
  assert.deepEqual(await readdir(parent), ['dist']);
});
