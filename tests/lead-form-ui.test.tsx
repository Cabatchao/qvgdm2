import assert from 'node:assert/strict';
import { after, afterEach, before, mock, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import LeadForm from '../components/LeadForm';

let dom: JSDOM;
let testing: typeof import('@testing-library/react');

before(async () => {
  dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' });
  for (const [key, value] of Object.entries({
    window: dom.window, self: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement, HTMLInputElement: dom.window.HTMLInputElement,
    HTMLSelectElement: dom.window.HTMLSelectElement, HTMLTextAreaElement: dom.window.HTMLTextAreaElement,
    Event: dom.window.Event, MouseEvent: dom.window.MouseEvent, getComputedStyle: dom.window.getComputedStyle,
    IS_REACT_ACT_ENVIRONMENT: true,
  })) Object.defineProperty(globalThis, key, { configurable: true, value, writable: true });
  testing = await import('@testing-library/react');
});
afterEach(() => { testing.cleanup(); mock.restoreAll(); });
after(() => dom.window.close());

function openForm() {
  const rendered = testing.render(createElement(LeadForm, { available: true }));
  const values: Record<string, string> = {
    firstName: 'Camille', lastName: 'Exemple', email: 'camille@example.test', city: 'Ville de test',
    hasRestaurantExperience: 'Oui', hasEntrepreneurExperience: 'Non', operatorModel: 'Oui',
    openingTimeline: '6-12 mois', localStatus: 'En recherche', format: 'Je ne sais pas encore',
    motivation: 'Je souhaite étudier un projet de pizzeria et présenter mon expérience.',
  };
  for (const [name, value] of Object.entries(values)) {
    const input = rendered.container.querySelector(`[name="${name}"]`);
    assert.ok(input, `Le champ ${name} doit être présent et nommé`);
    testing.fireEvent.change(input, { target: { value } });
  }
  const checkbox = rendered.container.querySelector('input[name="rgpd"]');
  assert.ok(checkbox);
  testing.fireEvent.click(checkbox);
  const form = rendered.container.querySelector('form');
  assert.ok(form);
  return { ...rendered, form };
}

function submittedBody(init?: RequestInit) {
  assert.equal(typeof init?.body, 'string');
  return JSON.parse(init!.body as string) as Record<string, unknown>;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function assertInputPreserved(container: HTMLElement) {
  assert.equal((container.querySelector('[name="firstName"]') as HTMLInputElement).value, 'Camille');
  assert.equal((container.querySelector('[name="email"]') as HTMLInputElement).value, 'camille@example.test');
  assert.equal((container.querySelector('[name="rgpd"]') as HTMLInputElement).checked, true);
}

test('le formulaire fermé ne saisit ni ne transmet de données', () => {
  const fetchMock = mock.method(globalThis, 'fetch', async () => { throw new Error('Aucun appel attendu'); });
  const rendered = testing.render(createElement(LeadForm));
  assert.equal(rendered.container.querySelector('form'), null);
  assert.equal(rendered.container.querySelector('input'), null);
  assert.match(rendered.container.textContent ?? '', /ne sont pas encore ouvertes/);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('sans hydratation, les champs restent désactivés et le formulaire ne peut pas fuir par URL', () => {
  const html = renderToStaticMarkup(createElement(LeadForm, { available: true }));
  const markup = new JSDOM(html);
  const form = markup.window.document.querySelector('form');
  assert.ok(form);
  assert.equal(form.method, 'post');
  assert.equal(form.getAttribute('action'), '/api/lead');
  const fields = [...form.querySelectorAll('fieldset')];
  assert.equal(fields.length, 2);
  assert.ok(fields.every(field => field.disabled));
  assert.equal((form.querySelector('button[type="submit"]') as HTMLButtonElement).disabled, true);
  assert.equal((form.querySelector('input[name="rgpd"]') as HTMLInputElement).disabled, true);
  markup.window.close();
});

test('une confirmation liée au même envoi affiche un reçu et ferme la saisie', async () => {
  let payload: Record<string, unknown> | undefined;
  const fetchMock = mock.method(globalThis, 'fetch', async (url: Parameters<typeof fetch>[0], init?: RequestInit) => {
    assert.equal(url, '/api/lead');
    assert.equal(init?.method, 'POST');
    payload = submittedBody(init);
    return jsonResponse({ ok: true, submissionId: payload.idempotencyKey }, 201);
  });
  const rendered = openForm();
  testing.fireEvent.submit(rendered.form);
  await testing.waitFor(() => assert.ok(rendered.queryByRole('status')));
  assert.equal(fetchMock.mock.callCount(), 1);
  assert.match(String(payload?.idempotencyKey), /^[a-f\d-]{36}$/i);
  assert.equal(payload?.personalContribution, '');
  assert.equal(payload?.estimatedBudget, '');
  assert.equal(payload?.rgpd, true);
  assert.equal(rendered.container.querySelector('form'), null);
  assert.match(rendered.getByRole('status').textContent ?? '', /ne vaut pas acceptation/);
  assert.equal(document.activeElement, rendered.getByRole('status'));
});

for (const scenario of [
  { name: 'un HTTP200 sans JSON', response: () => new Response('<html>erreur intermédiaire</html>', { status: 200 }) },
  { name: 'un HTTP200 okfalse', response: () => jsonResponse({ ok: false, message: 'Enregistrement impossible.' }) },
  { name: 'un reçu sans identifiant', response: () => jsonResponse({ ok: true }) },
  { name: 'un reçu qui appartient à un autre envoi', response: () => jsonResponse({ ok: true, submissionId: 'd1f75a8e-23f1-4ef3-aac7-7e52c178dba5' }) },
]) {
  test(`${scenario.name} ne doit pas créer de faux succès`, async () => {
    mock.method(globalThis, 'fetch', async () => scenario.response());
    const rendered = openForm();
    testing.fireEvent.submit(rendered.form);
    await testing.waitFor(() => assert.ok(rendered.queryByRole('alert')));
    assert.equal(rendered.queryByRole('status'), null);
    assertInputPreserved(rendered.container);
    assert.equal(document.activeElement, rendered.getByRole('alert'));
  });
}

test('une erreur réseau préserve les informations et la même clé lors du réessai', async () => {
  const ids: unknown[] = [];
  mock.method(globalThis, 'fetch', async (_url: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const payload = submittedBody(init);
    ids.push(payload.idempotencyKey);
    if (ids.length === 1) throw new TypeError('Réseau interrompu');
    return jsonResponse({ ok: true, submissionId: payload.idempotencyKey }, 201);
  });
  const rendered = openForm();
  testing.fireEvent.submit(rendered.form);
  await testing.waitFor(() => assert.ok(rendered.queryByRole('alert')));
  assertInputPreserved(rendered.container);
  testing.fireEvent.submit(rendered.form);
  await testing.waitFor(() => assert.ok(rendered.queryByRole('status')));
  assert.equal(ids.length, 2);
  assert.equal(ids[0], ids[1]);
});

test('la double soumission pendant le traitement ne crée qu’une requête', async () => {
  let resolveRequest: ((response: Response) => void) | undefined;
  let id: unknown;
  const fetchMock = mock.method(globalThis, 'fetch', async (_url: Parameters<typeof fetch>[0], init?: RequestInit) => {
    id = submittedBody(init).idempotencyKey;
    return new Promise<Response>((resolve) => { resolveRequest = resolve; });
  });
  const rendered = openForm();
  testing.fireEvent.submit(rendered.form);
  testing.fireEvent.submit(rendered.form);
  assert.equal(fetchMock.mock.callCount(), 1);
  assert.equal((rendered.container.querySelector('button[type="submit"]') as HTMLButtonElement).disabled, true);
  assert.equal(rendered.form.getAttribute('aria-busy'), 'true');
  assert.ok(resolveRequest);
  await testing.act(async () => { resolveRequest!(jsonResponse({ ok: true, submissionId: id }, 201)); });
  await testing.waitFor(() => assert.ok(rendered.queryByRole('status')));
});

test('les erreurs serveur sont reliées aux champs et la correction retire leur état invalide', async () => {
  mock.method(globalThis, 'fetch', async () => jsonResponse({ ok: false, message: 'Vérifiez les champs indiqués.', fieldErrors: { city: 'Cette ville doit être précisée.' } }, 422));
  const rendered = openForm();
  testing.fireEvent.submit(rendered.form);
  await testing.waitFor(() => assert.ok(rendered.queryByRole('alert')));
  const city = rendered.container.querySelector('[name="city"]') as HTMLInputElement;
  assert.equal(city.getAttribute('aria-invalid'), 'true');
  assert.match(city.getAttribute('aria-describedby') ?? '', /city-error/);
  assert.equal(rendered.container.querySelector('#city-error')?.textContent, 'Cette ville doit être précisée.');
  assert.equal(rendered.getByRole('link', { name: 'Cette ville doit être précisée.' }).getAttribute('href'), '#city');
  testing.fireEvent.change(city, { target: { value: 'Autre ville de test' } });
  assert.equal(city.getAttribute('aria-invalid'), 'false');
  assertInputPreserved(rendered.container);
});
