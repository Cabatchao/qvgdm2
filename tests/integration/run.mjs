/**
 * Local production-like receipt test, isolated from the production application.
 * REDIS_SERVER_PATH and REDIS_CLI_PATH point to locally installed Redis binaries.
 * Optional PLAYWRIGHT_EXECUTABLE_PATH selects an already available Chromium.
 */
import { mkdtemp, readFile, writeFile, cp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repo = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const redisServer = process.env.REDIS_SERVER_PATH;
const redisCli = process.env.REDIS_CLI_PATH;
if (!redisServer || !redisCli) throw new Error('Set REDIS_SERVER_PATH and REDIS_CLI_PATH to local Redis binaries. No services are provisioned by this script.');
const work = await mkdtemp(join(tmpdir(), 'pizza-zio-integration-'));
const app = join(work, 'app');
const settingsPath = join(work, 'settings.json');
const settings = {
  origin: 'http://127.0.0.1:3220', fixturePort: 3221, redisPort: 6391,
  database: join(work, 'applications.sqlite'), redisCli,
  webhookToken: randomBytes(32).toString('hex'), redisToken: randomBytes(32).toString('hex'),
  controlToken: randomBytes(32).toString('hex'), redisPassword: randomBytes(32).toString('hex'), hashSecret: randomBytes(32).toString('hex'),
};
const children = [];
const environment = { ...process.env, NEXT_TELEMETRY_DISABLED: '1', PIZZA_FIXTURE_SETTINGS: settingsPath };
function start(command, args, options = {}) {
  const child = spawn(command, args, { env: environment, stdio: 'inherit', ...options });
  children.push(child);
  return child;
}
async function finish(child) {
  return new Promise((resolveExit, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => code === 0 ? resolveExit() : reject(new Error(`Test process exited with ${code ?? signal}`)));
  });
}
async function waitFor(url) {
  for (let index = 0; index < 120; index++) {
    try { const response = await fetch(url, { signal: AbortSignal.timeout(500) }); if (response.ok) return; } catch { /* process is starting */ }
    await new Promise(resolveDelay => setTimeout(resolveDelay, 250));
  }
  throw new Error(`Fixture not ready: ${url}`);
}

try {
  for (const path of ['app', 'components', 'lib', 'data', 'next.config.mjs', 'proxy.ts', 'package.json', 'tsconfig.json', 'tailwind.config.ts', 'postcss.config.mjs']) await cp(join(repo, path), join(app, path), { recursive: true });
  await finish(start('cp', ['-al', join(repo, 'node_modules'), join(app, 'node_modules')]));
  await writeFile(settingsPath, JSON.stringify(settings), { mode: 0o600 });
  const home = await readFile(join(app, 'app/page.tsx'), 'utf8');
  if (!home.includes('available={isLeadIntakeReady()}')) throw new Error('The production page changed: review the isolated test injection.');
  await writeFile(join(app, 'app/page.tsx'), home.replace("import { isLeadIntakeReady } from '@/lib/leadConfig';", '').replace('available={isLeadIntakeReady()}', 'available={true}'));
  const fixtureConfig = { origin: settings.origin, webhookUrl: 'http://127.0.0.1:3221/lead', redisUrl: 'http://127.0.0.1:3221/redis', webhookToken: settings.webhookToken, redisToken: settings.redisToken, hashSecret: settings.hashSecret, vercel: false };
  await writeFile(join(app, 'app/api/lead/route.ts'), `// Generated in a temporary directory only; never deployed or imported by production.\nimport { handleLeadRequest } from '../../../lib/leadService';\nexport const runtime='nodejs';\nexport const dynamic='force-dynamic';\nexport async function POST(request: Request) { return handleLeadRequest(request, ${JSON.stringify(fixtureConfig)}); }\n`);
  const nextConfig = await readFile(join(app, 'next.config.mjs'), 'utf8');
  await writeFile(join(app, 'next.config.mjs'), nextConfig.replace('const nextConfig = {', 'const nextConfig = { experimental: { cpus: 2 },'));
  const build = start(process.execPath, [join(app, 'node_modules/next/dist/bin/next'), 'build'], { cwd: app });
  await finish(build);
  const redisConfiguration = join(work, 'redis.conf');
  await writeFile(redisConfiguration, `bind 127.0.0.1\nport ${settings.redisPort}\nsave ""\nappendonly no\nprotected-mode yes\nrequirepass ${settings.redisPassword}\ndir ${work}\n`, { mode: 0o600 });
  const ownedRedis = start(redisServer, [redisConfiguration], { stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((resolveReady, reject) => {
    const timer = setTimeout(() => reject(new Error('Our Redis process did not become ready')), 10_000);
    ownedRedis.once('exit', () => { clearTimeout(timer); reject(new Error('Redis could not start; refusing to contact an existing instance.')); });
    ownedRedis.stdout.on('data', chunk => {
      process.stdout.write(chunk);
      if (chunk.toString().includes('Ready to accept connections tcp')) { clearTimeout(timer); resolveReady(); }
    });
  });
  await finish(start(redisCli, ['-h', '127.0.0.1', '-p', String(settings.redisPort), 'PING'], { env: { ...environment, REDISCLI_AUTH: settings.redisPassword } }));
  start(process.execPath, [join(repo, 'tests/integration/fixture-server.mjs')], { cwd: repo });
  await waitFor('http://127.0.0.1:3221/health');
  start(process.execPath, [join(app, 'node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', '3220'], { cwd: app });
  await waitFor(settings.origin);
  await finish(start(process.execPath, [join(repo, 'node_modules/@playwright/test/cli.js'), 'test', '--config', join(repo, 'tests/integration/playwright.config.mjs')], { cwd: repo }));
  process.stdout.write('Real HTTP / Redis / SQLite integration checks passed. No external recipient contacted.\n');
} finally {
  for (const child of [...children].reverse()) if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
  await new Promise(resolveDelay => setTimeout(resolveDelay, 500));
  for (const child of children) if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
  await rm(work, { recursive: true, force: true });
}
