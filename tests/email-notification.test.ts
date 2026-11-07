import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { sheetHeaders } from '../lib/sheetReceiver';

const source = readFileSync(new URL('../integrations/google-apps-script/Code.gs', import.meta.url), 'utf8');
const id = (number: number) => `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`;
const bookId = 'synthetic_document_for_notifications';
type Mail = { to: string; subject: string; body: string; name: string };

function fixture(existing: number[] = []) {
  const events: string[] = [];
  const mails: Mail[] = [];
  const properties = new Map([['LEAD_NOTIFICATION_EMAIL', 'notifications@example.test']]);
  const triggers: { getHandlerFunction: () => string; minutes: number }[] = [];
  const state = { locked: false, quota: 100, failMail: false, failMailAfterAccept: false, failFlushAt: 0, flushes: 0 };
  class Sheet {
    maxRows = 1000;
    constructor(public name: string, public number: number, public rows: unknown[][] = []) {}
    getSheetId() { return this.number; }
    getLastRow() { return this.rows.length; }
    getMaxRows() { return this.maxRows; }
    insertRowsAfter(_start: number, count: number) { this.maxRows += count; }
    getRange(row: number, column: number, height: number, width: number) {
      return {
        getValues: () => {
          events.push(`read:${this.name}:${row}:${column}:${height}:${width}`);
          return Array.from({ length: height }, (_, offset) => Array.from({ length: width }, (_, index) => this.rows[row - 1 + offset]?.[column - 1 + index] ?? ''));
        },
        setValues: (values: unknown[][]) => {
          assert.equal(this.name, 'Notifications', 'The candidate sheet is never modified');
          assert.equal(values.length, height);
          values.forEach((value, offset) => {
            assert.equal(value.length, width);
            this.rows[row - 1 + offset] ??= [];
            value.forEach((cell, index) => { this.rows[row - 1 + offset][column - 1 + index] = cell; });
          });
          events.push('write:' + String(values[0][2]));
        },
      };
    }
  }
  const candidates = new Sheet('Candidatures', 10, [sheetHeaders.slice(), ...existing.map(number => [id(number)])]);
  const sheets = [candidates];
  const context = {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({
        getId: () => bookId,
        getSheetByName: (name: string) => sheets.find(sheet => sheet.name === name) ?? null,
        getSheetById: (number: number) => sheets.find(sheet => sheet.number === number) ?? null,
        insertSheet: (name: string) => { const sheet = new Sheet(name, 20); sheets.push(sheet); return sheet; },
      }),
      flush: () => {
        state.flushes++;
        events.push('flush');
        if (state.failFlushAt === state.flushes) throw new Error('Sensitive provider detail must not escape');
      },
    },
    PropertiesService: { getScriptProperties: () => ({
      getProperty: (key: string) => properties.get(key) ?? null,
      setProperty: (key: string, value: string) => { properties.set(key, value); },
      setProperties: (values: Record<string, string>) => Object.entries(values).forEach(([key, value]) => properties.set(key, value)),
    }) },
    LockService: { getScriptLock: () => ({
      tryLock: () => { if (state.locked) return false; state.locked = true; return true; },
      releaseLock: () => { state.locked = false; },
    }) },
    ScriptApp: {
      getProjectTriggers: () => triggers.slice(),
      deleteTrigger: (trigger: typeof triggers[number]) => { triggers.splice(triggers.indexOf(trigger), 1); },
      newTrigger: (handler: string) => ({ timeBased: () => ({ everyMinutes: (minutes: number) => ({
        create: () => { triggers.push({ getHandlerFunction: () => handler, minutes }); },
      }) }) }),
    },
    MailApp: {
      getRemainingDailyQuota: () => state.quota,
      sendEmail: (mail: Mail) => {
        assert.equal(events.at(-1), 'flush', 'Intent must be flushed before send');
        assert.equal(sheets.find(sheet => sheet.name === 'Notifications')!.rows.at(-1)![2], 'en_cours');
        events.push('send');
        if (state.failMail) throw new Error('Provider error containing notifications@example.test');
        mails.push(JSON.parse(JSON.stringify(mail)));
        state.quota--;
        if (state.failMailAfterAccept) throw new Error('Synthetic lost send acknowledgement');
      },
    },
  };
  runInNewContext(source, context);
  const call = (name: 'installNotifications' | 'pollLeadNotifications') => JSON.parse(JSON.stringify(runInNewContext(`${name}()`, context))) as { status: string; sent?: number };
  return { state, properties, candidates, sheets, mails, events, triggers, call,
    journal: () => sheets.find(sheet => sheet.name === 'Notifications')!,
    add: (number: number) => candidates.rows.push([id(number), 'fingerprint', '2026-11-07', '', '', '', '', 'Private Name', 'Private Surname', 'candidate@example.test', '', '', '', '', '', 123456, 999999, '', '', '', '', 'Secret project']) };
}

test('installation sends no history, creates one five-minute trigger, and repeated installation is safe', () => {
  const f = fixture([1, 2]);
  f.call('installNotifications');
  f.call('installNotifications');
  assert.equal(f.mails.length, 0);
  assert.equal(f.triggers.length, 1);
  assert.equal(f.triggers[0].minutes, 5);
  assert.deepEqual(f.journal().rows.slice(1).map(row => row[2]), ['historique_ignore', 'historique_ignore']);
  assert.equal(f.call('pollLeadNotifications').sent, 0);
});

test('one new lead sends reference and private link only, with flushed intent and no replay', () => {
  const f = fixture(); f.call('installNotifications'); f.add(1);
  assert.equal(f.call('pollLeadNotifications').sent, 1);
  assert.equal(f.call('pollLeadNotifications').sent, 0);
  assert.equal(f.mails.length, 1);
  const email = f.mails[0];
  assert.equal(email.to, 'notifications@example.test');
  assert.ok(email.body.includes(id(1)));
  assert.ok(email.body.includes(`https://docs.google.com/spreadsheets/d/${bookId}/edit#gid=10`));
  for (const secret of ['Private Name', 'Private Surname', 'candidate@example.test', '123456', '999999', 'Secret project']) assert.equal(JSON.stringify(email).includes(secret), false);
  assert.equal(f.journal().rows[1][2], 'envoye');
  assert.ok(f.events.some(event => event === 'read:Candidatures:2:1:1:1'));
  assert.equal(f.events.some(event => event.startsWith('read:Candidatures:2:') && !event.endsWith(':1')), false);
});

test('mail failure and an interrupted previous intent require review without automatic resend', () => {
  const f = fixture(); f.call('installNotifications'); f.add(1); f.state.failMail = true;
  assert.equal(f.call('pollLeadNotifications').status, 'needs_review');
  assert.equal(f.journal().rows[1][2], 'a_verifier');
  f.state.failMail = false;
  assert.equal(f.call('pollLeadNotifications').sent, 0);
  f.add(2);
  f.journal().rows.push([id(2), new Date().toISOString(), 'en_cours']);
  assert.equal(f.call('pollLeadNotifications').sent, 0);
  assert.equal(f.journal().rows[2][2], 'a_verifier');
  assert.equal(f.mails.length, 0);
});

test('a journal flush failure prevents sending and never exposes provider details', () => {
  const f = fixture(); f.call('installNotifications'); f.add(1);
  f.state.failFlushAt = f.state.flushes + 1;
  assert.throws(() => f.call('pollLeadNotifications'), /ZIO_OPERATION_FAILED/);
  assert.equal(f.mails.length, 0);
  assert.equal(f.state.locked, false);
});

test('a lost acknowledgement after email acceptance does not cause a second email', () => {
  const f = fixture(); f.call('installNotifications'); f.add(1); f.state.failMailAfterAccept = true;
  assert.equal(f.call('pollLeadNotifications').status, 'needs_review');
  assert.equal(f.mails.length, 1);
  assert.equal(f.journal().rows[1][2], 'a_verifier');
  f.state.failMailAfterAccept = false;
  assert.equal(f.call('pollLeadNotifications').sent, 0);
  assert.equal(f.mails.length, 1);
});

test('a failed sent-status flush after email acceptance does not cause a second email', () => {
  const f = fixture(); f.call('installNotifications'); f.add(1);
  f.state.failFlushAt = f.state.flushes + 2; // Intent flush succeeds; sent receipt flush fails.
  assert.equal(f.call('pollLeadNotifications').status, 'needs_review');
  assert.equal(f.mails.length, 1);
  assert.equal(f.journal().rows[1][2], 'a_verifier');
  assert.equal(f.call('pollLeadNotifications').sent, 0);
  assert.equal(f.mails.length, 1);
});

test('the script lock blocks concurrent work and each execution sends at most five emails', () => {
  const f = fixture(); f.call('installNotifications');
  for (let i = 1; i <= 7; i++) f.add(i);
  f.state.locked = true;
  assert.equal(f.call('pollLeadNotifications').status, 'busy');
  assert.equal(f.mails.length, 0);
  f.state.locked = false;
  assert.equal(f.call('pollLeadNotifications').sent, 5);
  assert.equal(f.call('pollLeadNotifications').sent, 2);
  assert.equal(new Set(f.mails.map(mail => mail.subject)).size, 7);
});

test('zero quota records no intent and the unseen lead is retried when quota returns', () => {
  const f = fixture(); f.call('installNotifications'); f.add(1); f.state.quota = 0;
  assert.equal(f.call('pollLeadNotifications').status, 'quota_exhausted');
  assert.equal(f.journal().rows.length, 1);
  f.state.quota = 1;
  assert.equal(f.call('pollLeadNotifications').sent, 1);
});

test('missing or invalid recipients stop installation and delivery without revealing their value', () => {
  for (const value of ['', 'bad', 'a@example.test,b@example.test', 'a@example.test\r\nBcc:x@example.test', 'Name <a@example.test>', 'a..b@example.test']) {
    const f = fixture(); f.properties.set('LEAD_NOTIFICATION_EMAIL', value);
    assert.throws(() => f.call('installNotifications'), /^Error: ZIO_RECIPIENT_INVALID$/);
    assert.equal(f.triggers.length, 0);
    assert.equal(f.mails.length, 0);
  }
  const f = fixture(); f.call('installNotifications'); f.add(1); f.properties.delete('LEAD_NOTIFICATION_EMAIL');
  assert.throws(() => f.call('pollLeadNotifications'), /ZIO_RECIPIENT_INVALID/);
  assert.equal(f.mails.length, 0);
});

test('changed headers, duplicate references or a missing journal stop notification', () => {
  const f = fixture(); f.call('installNotifications'); f.add(1);
  f.candidates.rows[0][0] = 'Modified';
  assert.throws(() => f.call('pollLeadNotifications'), /ZIO_HEADERS_CHANGED/);
  f.candidates.rows[0][0] = sheetHeaders[0]; f.add(1);
  assert.throws(() => f.call('pollLeadNotifications'), /ZIO_REFERENCE_INVALID/);
  f.candidates.rows.pop(); f.sheets.pop();
  assert.throws(() => f.call('pollLeadNotifications'), /ZIO_TRACKING_MISSING/);
  assert.equal(f.mails.length, 0);
});

test('notifications start disabled and the manifest grants no inbox or external-network access', () => {
  const f = fixture([1]);
  assert.equal(f.call('pollLeadNotifications').status, 'disabled');
  assert.equal(f.mails.length, 0);
  const manifest = JSON.parse(readFileSync(new URL('../integrations/google-apps-script/appsscript.json', import.meta.url), 'utf8'));
  assert.deepEqual(manifest.oauthScopes, ['https://www.googleapis.com/auth/spreadsheets.currentonly', 'https://www.googleapis.com/auth/script.send_mail', 'https://www.googleapis.com/auth/script.scriptapp']);
  assert.ok(source.startsWith('/** @OnlyCurrentDoc */'));
  assert.equal(/GmailApp|UrlFetchApp|doPost\s*\(|doGet\s*\(/.test(source), false);
});
