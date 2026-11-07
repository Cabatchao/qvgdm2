/** @OnlyCurrentDoc */
/* Private, container-bound notification worker. No public web app endpoint. */
const ZIO_HEADERS = [
  'Référence', 'Empreinte', 'Reçu le (UTC)', 'Statut', 'Responsable', 'Prochaine action', 'Échéance',
  'Prénom', 'Nom', 'Email', 'Téléphone', 'Ville', 'Département', 'Format', 'Calendrier',
  'Apport (€)', 'Budget (€)', 'Expérience restauration', 'Expérience entrepreneuriale', 'Exploitant',
  'Local', 'Projet', 'Question', 'Notice acceptée', 'Version de la notice',
];
const ZIO_LOG_HEADERS = ['Référence', 'Date (UTC)', 'Statut'];
const ZIO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const ZIO_HANDLER = 'pollLeadNotifications';
const ZIO_MAX_ROWS = 10000;
const ZIO_BATCH_SIZE = 5;

/** Run once, explicitly, from the bound Apps Script editor. Sends no email. */
function installNotifications() {
  return zioLocked_(function () {
    const properties = PropertiesService.getScriptProperties();
    zioRecipient_(properties);
    const book = zioBook_();
    const previousBook = properties.getProperty('ZIO_NOTIFICATION_BOOK');
    if (previousBook && previousBook !== book.getId()) zioFail_('ZIO_WRONG_DOCUMENT');
    let source;
    let journal;
    if (previousBook) {
      source = book.getSheetById(Number(properties.getProperty('ZIO_NOTIFICATION_SOURCE')));
      journal = book.getSheetById(Number(properties.getProperty('ZIO_NOTIFICATION_JOURNAL')));
      if (!source || !journal || source.getSheetId() === journal.getSheetId()) zioFail_('ZIO_TRACKING_MISSING');
      zioHeaders_(source, ZIO_HEADERS);
      zioJournal_(journal);
    } else {
      source = book.getSheetByName('Candidatures');
      zioHeaders_(source, ZIO_HEADERS);
      const references = zioReferences_(source);
      journal = book.getSheetByName('Notifications');
      if (!journal) {
        journal = book.insertSheet('Notifications');
        zioWrite_(journal, 1, [ZIO_LOG_HEADERS]);
      }
      const known = zioJournal_(journal);
      const now = new Date().toISOString();
      const baseline = references.filter(function (id) { return !known.has(id); })
        .map(function (id) { return [id, now, 'historique_ignore']; });
      if (baseline.length) zioWrite_(journal, journal.getLastRow() + 1, baseline);
      SpreadsheetApp.flush();
      properties.setProperties({
        ZIO_NOTIFICATION_BOOK: book.getId(),
        ZIO_NOTIFICATION_SOURCE: String(source.getSheetId()),
        ZIO_NOTIFICATION_JOURNAL: String(journal.getSheetId()),
      });
    }
    // A single operator installs the trigger. ScriptLock + the journal also
    // protect against other accounts' triggers, which this API cannot list.
    const triggers = ScriptApp.getProjectTriggers().filter(function (trigger) {
      return trigger.getHandlerFunction() === ZIO_HANDLER;
    });
    triggers.slice(1).forEach(function (trigger) { ScriptApp.deleteTrigger(trigger); });
    if (!triggers.length) ScriptApp.newTrigger(ZIO_HANDLER).timeBased().everyMinutes(5).create();
    properties.setProperty('LEAD_NOTIFICATIONS_ENABLED', 'true');
    return { status: 'installed', historicalEmailsSent: 0 };
  });
}

/** Time-driven trigger only. An API write does not fire onEdit. */
function pollLeadNotifications() {
  return zioLocked_(function () {
    const properties = PropertiesService.getScriptProperties();
    if (properties.getProperty('LEAD_NOTIFICATIONS_ENABLED') !== 'true') return { status: 'disabled', sent: 0 };
    const recipient = zioRecipient_(properties);
    const book = zioBook_();
    if (properties.getProperty('ZIO_NOTIFICATION_BOOK') !== book.getId()) zioFail_('ZIO_NOT_INSTALLED');
    const source = book.getSheetById(Number(properties.getProperty('ZIO_NOTIFICATION_SOURCE')));
    const journal = book.getSheetById(Number(properties.getProperty('ZIO_NOTIFICATION_JOURNAL')));
    if (!source || !journal || source.getSheetId() === journal.getSheetId()) zioFail_('ZIO_TRACKING_MISSING');
    zioHeaders_(source, ZIO_HEADERS);
    const known = zioJournal_(journal);
    const references = zioReferences_(source);
    let changed = false;
    // A previous execution may have stopped after delivery but before its ACK.
    // Never retry that uncertain email automatically.
    known.forEach(function (record) {
      if (record.status === 'en_cours') {
        zioWrite_(journal, record.row, [[record.id, new Date().toISOString(), 'a_verifier']]);
        record.status = 'a_verifier';
        changed = true;
      }
    });
    if (changed) SpreadsheetApp.flush();
    const pending = references.filter(function (id) { return !known.has(id); }).slice(0, ZIO_BATCH_SIZE);
    let sent = 0;
    for (const id of pending) {
      const quota = MailApp.getRemainingDailyQuota();
      if (!Number.isFinite(quota) || quota < 1) return { status: 'quota_exhausted', sent: sent };
      const row = journal.getLastRow() + 1;
      zioWrite_(journal, row, [[id, new Date().toISOString(), 'en_cours']]);
      SpreadsheetApp.flush(); // Durable intent before any send.
      try {
        MailApp.sendEmail({
          to: recipient,
          subject: 'Pizza Zio — nouvelle candidature ' + id,
          body: 'Une candidature a été enregistrée.\n\nRéférence : ' + id
            + '\nTableau privé : https://docs.google.com/spreadsheets/d/' + book.getId()
            + '/edit#gid=' + source.getSheetId()
            + '\n\nConsultez le tableau avec votre compte autorisé.',
          name: 'Pizza Zio — candidatures',
        });
        zioWrite_(journal, row, [[id, new Date().toISOString(), 'envoye']]);
        SpreadsheetApp.flush();
        sent++;
      } catch (_error) {
        // The provider may have accepted the email before its response failed.
        zioWrite_(journal, row, [[id, new Date().toISOString(), 'a_verifier']]);
        SpreadsheetApp.flush();
        return { status: 'needs_review', sent: sent };
      }
    }
    return { status: 'completed', sent: sent };
  });
}

function zioRecipient_(properties) {
  const value = properties.getProperty('LEAD_NOTIFICATION_EMAIL') || '';
  if (value.length > 254 || !/^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/.test(value)
      || /\s|\.\.|^\.|\.@/.test(value)) zioFail_('ZIO_RECIPIENT_INVALID');
  return value;
}

function zioBook_() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  if (!book || !/^[A-Za-z0-9_-]{20,128}$/.test(book.getId())) zioFail_('ZIO_BOUND_DOCUMENT_REQUIRED');
  return book;
}

function zioHeaders_(sheet, expected) {
  if (!sheet || JSON.stringify(sheet.getRange(1, 1, 1, expected.length).getValues()[0]) !== JSON.stringify(expected)) zioFail_('ZIO_HEADERS_CHANGED');
}

function zioReferences_(sheet) {
  const count = sheet.getLastRow() - 1;
  if (count < 0 || count > ZIO_MAX_ROWS) zioFail_('ZIO_ROW_LIMIT');
  const references = count ? sheet.getRange(2, 1, count, 1).getValues().map(function (row) { return row[0]; }) : [];
  const unique = new Set();
  references.forEach(function (id) {
    if (typeof id !== 'string' || !ZIO_UUID.test(id) || unique.has(id)) zioFail_('ZIO_REFERENCE_INVALID');
    unique.add(id);
  });
  return references;
}

function zioJournal_(sheet) {
  zioHeaders_(sheet, ZIO_LOG_HEADERS);
  const count = sheet.getLastRow() - 1;
  if (count < 0 || count > ZIO_MAX_ROWS) zioFail_('ZIO_ROW_LIMIT');
  const rows = count ? sheet.getRange(2, 1, count, 3).getValues() : [];
  const known = new Map();
  rows.forEach(function (row, index) {
    if (typeof row[0] !== 'string' || !ZIO_UUID.test(row[0]) || known.has(row[0])
        || !['historique_ignore', 'en_cours', 'envoye', 'a_verifier'].includes(row[2])) zioFail_('ZIO_JOURNAL_INVALID');
    known.set(row[0], { id: row[0], row: index + 2, status: row[2] });
  });
  return known;
}

function zioWrite_(sheet, startRow, rows) {
  const endRow = startRow + rows.length - 1;
  if (endRow > ZIO_MAX_ROWS + 1) zioFail_('ZIO_ROW_LIMIT');
  if (endRow > sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(), endRow - sheet.getMaxRows());
  sheet.getRange(startRow, 1, rows.length, 3).setValues(rows);
}

function zioLocked_(action) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return { status: 'busy', sent: 0 };
  try { return action(); }
  catch (error) {
    const code = error && typeof error.message === 'string' && /^ZIO_[A-Z_]+$/.test(error.message)
      ? error.message : 'ZIO_OPERATION_FAILED';
    throw new Error(code); // Never log provider responses, recipient or row data.
  } finally { lock.releaseLock(); }
}

function zioFail_(code) { throw new Error(code); }
