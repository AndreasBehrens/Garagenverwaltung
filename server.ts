import express from 'express';
import path from 'path';
import fs from 'fs';
import { initialDbData } from './src/data/seed.ts';
import { DbSchema, AuditLog, Notification, Zahlung } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to the database file
const DB_FILE = path.join(process.cwd(), 'src', 'data', 'db.json');

// Ensure database directory exists and load data
function getDb(): DbSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const dbDir = path.dirname(DB_FILE);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDbData, null, 2), 'utf-8');
      return initialDbData;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw) as DbSchema;
  } catch (error) {
    console.error('Error reading DB file, returning seed data:', error);
    return initialDbData;
  }
}

function saveDb(db: DbSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing DB file:', error);
  }
}

// Helper to write an audit log entry on the server
function writeAuditLog(
  aktion: string,
  details: string,
  bereich: AuditLog['bereich'],
  benutzer = 'andreas.behrens@futureprofai.de',
  rolle: 'Administrator' | 'Nutzer' = 'Administrator',
  req?: express.Request
) {
  const db = getDb();
  const ip = req?.ip || req?.headers['x-forwarded-for'] as string || '127.0.0.1';
  
  const newLog: AuditLog = {
    id: `al-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toISOString(),
    benutzer,
    rolle,
    aktion,
    details,
    bereich,
    ipAdresse: ip,
  };
  
  db.auditLogs.unshift(newLog); // Prepend new logs to display them newest-first
  saveDb(db);
}

// -------------------------------------------------------------
// SECURE EXTERNAL ACCOUNTING API (Zwingend erforderlich)
// -------------------------------------------------------------
// Middleware to authenticate external accounting requests with Bearer Token
function authAccountingApi(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const db = getDb();
  const token = db.settings.apiToken || 'gm_live_8f3a9e2c1b7d5e4a0f6c';

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    writeAuditLog(
      'Schnittstellen-Zugriff verweigert',
      `Fehlendes oder ungültiges Token bei Aufruf von ${req.originalUrl}`,
      'Sicherheit',
      'Unbekanntes System',
      'Nutzer',
      req
    );
    return res.status(401).json({ 
      success: false, 
      error: 'Nicht autorisiert. Gültiges Bearer Token erforderlich.' 
    });
  }

  const clientToken = authHeader.substring(7);
  if (clientToken !== token) {
    writeAuditLog(
      'Schnittstellen-Zugriff verweigert',
      `Falsches Token (${clientToken.substring(0, 5)}...) bei Aufruf von ${req.originalUrl}`,
      'Sicherheit',
      'Unbekanntes System',
      'Nutzer',
      req
    );
    return res.status(403).json({ 
      success: false, 
      error: 'Ungültiges API Token.' 
    });
  }

  next();
}

// Endpoint 1: Get all billing invoices/payments
app.get('/api/v1/accounting/invoices', authAccountingApi, (req, res) => {
  const db = getDb();
  writeAuditLog(
    'Schnittstellen-Zugriff (API)',
    `Externes Buchhaltungssystem hat Rechnungsdaten (Zahlungsdatensätze) abgerufen.`,
    'API',
    'external-accounting-bot',
    'Nutzer',
    req
  );
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    invoices: db.zahlungen.map(z => {
      const mieter = db.mieter.find(m => m.id === z.mieterId);
      const stellplatz = db.stellplaetze.find(s => s.id === z.stellplatzId);
      return {
        rechnungsId: z.id,
        vertragsId: z.vertragsId,
        mieterName: mieter ? `${mieter.vorname} ${mieter.nachname}` : 'Unbekannt',
        mieterEmail: mieter?.email || '',
        iban: mieter?.iban || '',
        stellplatzName: stellplatz?.bezeichnung || '',
        betrag: z.betrag,
        monat: z.monat,
        faelligkeitsdatum: z.faelligAm,
        status: z.status,
        mahnstufe: z.mahnstufe,
        bezahltAm: z.bezahltAm
      };
    })
  });
});

// Endpoint 2: Get all active tenant accounts
app.get('/api/v1/accounting/tenants', authAccountingApi, (req, res) => {
  const db = getDb();
  writeAuditLog(
    'Schnittstellen-Zugriff (API)',
    `Externes Buchhaltungssystem hat Mieterstammdaten abgerufen.`,
    'API',
    'external-accounting-bot',
    'Nutzer',
    req
  );
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    tenants: db.mieter.map(m => ({
      mieterId: m.id,
      name: `${m.vorname} ${m.nachname}`,
      firma: m.firma || '',
      email: m.email,
      telefon: m.telefon,
      adresse: `${m.adresse}, ${m.plz} ${m.ort}`,
      iban: m.iban,
      status: m.status
    }))
  });
});

// Endpoint 3: Simulate payment state sync from external bookkeeping ledger
app.post('/api/v1/accounting/sync-payment', authAccountingApi, (req, res) => {
  const { rechnungsId, bezahltAm, zahlungsart } = req.body;
  if (!rechnungsId) {
    return res.status(400).json({ success: false, error: 'rechnungsId ist erforderlich.' });
  }

  const db = getDb();
  const index = db.zahlungen.findIndex(z => z.id === rechnungsId);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Rechnungsdatensatz nicht gefunden.' });
  }

  const z = db.zahlungen[index];
  const alterStatus = z.status;
  z.status = 'Bezahlt';
  z.bezahltAm = bezahltAm || new Date().toISOString().split('T')[0];
  z.zahlungsart = zahlungsart || z.zahlungsart;

  saveDb(db);

  writeAuditLog(
    'Schnittstellen-Synchronisation',
    `Rechnung ${rechnungsId} über ${z.betrag} € wurde via API auf Bezahlt gesetzt (Alt: ${alterStatus}).`,
    'API',
    'external-accounting-bot',
    'Nutzer',
    req
  );

  res.json({
    success: true,
    message: 'Zahlungsstatus erfolgreich synchronisiert.',
    updatedRecord: z
  });
});


// -------------------------------------------------------------
// CORE INTERN DATABASE ENDPOINTS
// --------------------------------------------------------// Load whole database
app.get('/api/db', (req, res) => {
  res.json(getDb());
});

// App.tsx main load data endpoint
app.get('/api/data', (req, res) => {
  res.json({ success: true, db: getDb() });
});

// Reset database (supports both endpoints)
app.post('/api/actions/reset-db', (req, res) => {
  const role = req.body?.role || 'Administrator';
  saveDb(initialDbData);
  writeAuditLog('Datenbank-Reset', 'Die Datenbank wurde auf die Standard-Demodaten zurückgesetzt.', 'Sicherheit', 'andreas.behrens@futureprofai.de', role, req);
  res.json({ success: true, db: initialDbData });
});

app.post('/api/db/reset', (req, res) => {
  const role = req.body?.role || 'Administrator';
  saveDb(initialDbData);
  writeAuditLog('Datenbank-Reset', 'Die Datenbank wurde auf die Standard-Demodaten zurückgesetzt.', 'Sicherheit', 'andreas.behrens@futureprofai.de', role, req);
  res.json({ success: true, db: initialDbData });
});

// Audit manual logger and generic logging endpoints
app.post('/api/data', (req, res) => {
  const { action, details, section, user, role } = req.body;
  writeAuditLog(
    action || 'Systemaktion',
    details || '',
    (section || 'Sicherheit') as any,
    user || 'SYSTEM',
    role || 'Administrator',
    req
  );
  res.json({ success: true });
});

app.post('/api/audit', (req, res) => {
  const { aktion, details, bereich, user, role } = req.body;
  writeAuditLog(aktion || 'Systemaktion', details || '', (bereich || 'Sicherheit') as any, user || 'andreas.behrens@futureprofai.de', role || 'Administrator', req);
  res.json({ success: true });
});

// Clear Audit Logs
app.post('/api/audit-logs/clear', (req, res) => {
  const role = req.body?.role || 'Administrator';
  const db = getDb();
  db.auditLogs = [];
  saveDb(db);
  writeAuditLog('Audit-Logs geleert', 'Das Sicherheitsprüfprotokoll wurde manuell geleert.', 'Sicherheit', 'andreas.behrens@futureprofai.de', role, req);
  res.json({ success: true });
});

// STANDORTE (Locations) CRUD
app.post('/api/standorte', (req, res) => {
  const db = getDb();
  const payload = req.body.item || req.body;
  const role = req.body.role || req.body.operatorRole || 'Administrator';
  const item = { ...payload, id: `st-${Date.now()}` };
  db.standorte.push(item);
  saveDb(db);
  writeAuditLog('Standort erstellt', `Standort ${item.name} (${item.ort}) wurde hinzugefügt.`, 'Einstellungen', 'andreas.behrens@futureprofai.de', role, req);
  res.json({ success: true, item });
});

app.put('/api/standorte/:id', (req, res) => {
  const db = getDb();
  const payload = req.body.item || req.body;
  const role = req.body.role || req.body.operatorRole || 'Administrator';
  const index = db.standorte.findIndex(s => s.id === req.params.id);
  if (index !== -1) {
    db.standorte[index] = { ...db.standorte[index], ...payload };
    saveDb(db);
    writeAuditLog('Standort bearbeitet', `Standort ${db.standorte[index].name} wurde aktualisiert.`, 'Einstellungen', 'andreas.behrens@futureprofai.de', role, req);
    res.json({ success: true, item: db.standorte[index] });
  } else {
    res.status(404).json({ success: false, error: 'Not found' });
  }
});

app.delete('/api/standorte/:id', (req, res) => {
  const db = getDb();
  const role = req.body?.role || req.query?.operatorRole || 'Administrator';
  const index = db.standorte.findIndex(s => s.id === req.params.id);
  if (index !== -1) {
    const deleted = db.standorte[index];
    db.standorte.splice(index, 1);
    saveDb(db);
    writeAuditLog('Standort gelöscht', `Standort ${deleted.name} wurde entfernt.`, 'Einstellungen', 'andreas.behrens@futureprofai.de', role, req);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, error: 'Not found' });
  }
});


// STELLPLAETZE (Garages) CRUD
app.post('/api/stellplaetze', (req, res) => {
  const db = getDb();
  const payload = req.body.item || req.body;
  const role = req.body.role || req.body.operatorRole || 'Administrator';
  const item = { ...payload, id: `sp-${Date.now()}` };
  db.stellplaetze.push(item);
  saveDb(db);
  writeAuditLog('Stellplatz angelegt', `Stellplatz ${item.bezeichnung} angelegt.`, 'Einstellungen', 'andreas.behrens@futureprofai.de', role, req);
  res.json({ success: true, item });
});

app.put('/api/stellplaetze/:id', (req, res) => {
  const db = getDb();
  const payload = req.body.item || req.body;
  const role = req.body.role || req.body.operatorRole || 'Administrator';
  const index = db.stellplaetze.findIndex(s => s.id === req.params.id);
  if (index !== -1) {
    db.stellplaetze[index] = { ...db.stellplaetze[index], ...payload };
    saveDb(db);
    writeAuditLog('Stellplatz bearbeitet', `Stellplatz ${db.stellplaetze[index].bezeichnung} wurde aktualisiert.`, 'Einstellungen', 'andreas.behrens@futureprofai.de', role, req);
    res.json({ success: true, item: db.stellplaetze[index] });
  } else {
    res.status(404).json({ success: false, error: 'Not found' });
  }
});

app.delete('/api/stellplaetze/:id', (req, res) => {
  const db = getDb();
  const role = req.body?.role || req.query?.operatorRole || 'Administrator';
  const index = db.stellplaetze.findIndex(s => s.id === req.params.id);
  if (index !== -1) {
    const deleted = db.stellplaetze[index];
    db.stellplaetze.splice(index, 1);
    saveDb(db);
    writeAuditLog('Stellplatz gelöscht', `Stellplatz ${deleted.bezeichnung} wurde entfernt.`, 'Einstellungen', 'andreas.behrens@futureprofai.de', role, req);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, error: 'Not found' });
  }
});


// MIETER (Tenants) CRUD
app.post('/api/mieter', (req, res) => {
  const db = getDb();
  const payload = req.body.item || req.body;
  const role = req.body.role || req.body.operatorRole || 'Administrator';
  const item = { ...payload, id: `m-${Date.now()}` };
  db.mieter.push(item);
  saveDb(db);
  writeAuditLog('Mieter angelegt', `Mieter ${item.vorname} ${item.nachname} wurde registriert.`, 'Mieter', 'andreas.behrens@futureprofai.de', role, req);
  res.json({ success: true, item });
});

app.put('/api/mieter/:id', (req, res) => {
  const db = getDb();
  const payload = req.body.item || req.body;
  const role = req.body.role || req.body.operatorRole || 'Administrator';
  const index = db.mieter.findIndex(s => s.id === req.params.id);
  if (index !== -1) {
    db.mieter[index] = { ...db.mieter[index], ...payload };
    saveDb(db);
    writeAuditLog('Mieter bearbeitet', `Mietstammdaten für ${db.mieter[index].vorname} ${db.mieter[index].nachname} aktualisiert.`, 'Mieter', 'andreas.behrens@futureprofai.de', role, req);
    res.json({ success: true, item: db.mieter[index] });
  } else {
    res.status(404).json({ success: false, error: 'Not found' });
  }
});

app.delete('/api/mieter/:id', (req, res) => {
  const db = getDb();
  const role = req.body?.role || req.query?.operatorRole || 'Administrator';
  const index = db.mieter.findIndex(s => s.id === req.params.id);
  if (index !== -1) {
    const deleted = db.mieter[index];
    db.mieter.splice(index, 1);
    saveDb(db);
    writeAuditLog('Mieter gelöscht', `Mieter ${deleted.vorname} ${deleted.nachname} wurde entfernt.`, 'Mieter', 'andreas.behrens@futureprofai.de', role, req);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, error: 'Not found' });
  }
});


// VERTRAEGE (Contracts) CRUD
app.post('/api/vertraege', (req, res) => {
  const db = getDb();
  const payload = req.body.item || req.body;
  const role = req.body.role || req.body.operatorRole || 'Administrator';
  const vertragsNummer = `VT-26-${String(db.vertraege.length + 1).padStart(4, '0')}`;
  const item = { 
    ...payload, 
    id: `vt-${Date.now()}`,
    vertragsNummer,
    erstelltAm: new Date().toISOString().split('T')[0],
    dokumentUrl: `/api/vertraege/vt-${Date.now()}/pdf-preview`
  };
  db.vertraege.push(item);

  // Automatically mark the linked garage/stellplatz as Vermietet!
  const spIndex = db.stellplaetze.findIndex(s => s.id === item.stellplatzId);
  if (spIndex !== -1) {
    db.stellplaetze[spIndex].status = 'Vermietet';
  }

  saveDb(db);
  writeAuditLog('Vertrag erstellt', `Vertrag ${vertragsNummer} wurde generiert und aktiviert. Stellplatz reserviert.`, 'Verträge', 'andreas.behrens@futureprofai.de', role, req);
  res.json({ success: true, item });
});

app.put('/api/vertraege/:id', (req, res) => {
  const db = getDb();
  const payload = req.body.item || req.body;
  const role = req.body.role || req.body.operatorRole || 'Administrator';
  const index = db.vertraege.findIndex(s => s.id === req.params.id);
  if (index !== -1) {
    const altStatus = db.vertraege[index].status;
    db.vertraege[index] = { ...db.vertraege[index], ...payload };

    // If status changed to gekuendigt/beendet, adjust the garage status optionally
    if (payload.status === 'Beendet') {
      const spIndex = db.stellplaetze.findIndex(s => s.id === db.vertraege[index].stellplatzId);
      if (spIndex !== -1) {
        db.stellplaetze[spIndex].status = 'Frei';
      }
    }

    saveDb(db);
    writeAuditLog('Vertrag geändert', `Vertrag ${db.vertraege[index].vertragsNummer} geändert (Status von ${altStatus} zu ${db.vertraege[index].status}).`, 'Verträge', 'andreas.behrens@futureprofai.de', role, req);
    res.json({ success: true, item: db.vertraege[index] });
  } else {
    res.status(404).json({ success: false, error: 'Not found' });
  }
});

app.delete('/api/vertraege/:id', (req, res) => {
  const db = getDb();
  const role = req.body?.role || req.query?.operatorRole || 'Administrator';
  const index = db.vertraege.findIndex(s => s.id === req.params.id);
  if (index !== -1) {
    const deleted = db.vertraege[index];
    db.vertraege.splice(index, 1);
    
    // Set space back to Frei if it was Vermietet
    const spIndex = db.stellplaetze.findIndex(s => s.id === deleted.stellplatzId);
    if (spIndex !== -1) {
      db.stellplaetze[spIndex].status = 'Frei';
    }

    saveDb(db);
    writeAuditLog('Vertrag gelöscht', `Vertrag ${deleted.vertragsNummer} wurde gelöscht. Stellplatz wieder freigegeben.`, 'Verträge', 'andreas.behrens@futureprofai.de', role, req);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, error: 'Not found' });
  }
});


// ZAHLUNGEN (Payments) CRUD & ACTIONS
app.post('/api/zahlungen', (req, res) => {
  const db = getDb();
  const payload = req.body.item || req.body;
  const role = req.body.role || req.body.operatorRole || 'Administrator';
  const item = { ...payload, id: `z-${Date.now()}` };
  db.zahlungen.push(item);
  saveDb(db);
  writeAuditLog('Zahlung manuell angelegt', `Mietrechnung über ${item.betrag} € für Monat ${item.monat} manuell angelegt.`, 'Zahlungen', 'andreas.behrens@futureprofai.de', role, req);
  res.json({ success: true, item });
});

app.put('/api/zahlungen/:id', (req, res) => {
  const db = getDb();
  const payload = req.body.item || req.body;
  const role = req.body.role || req.body.operatorRole || 'Administrator';
  const index = db.zahlungen.findIndex(z => z.id === req.params.id);
  if (index !== -1) {
    db.zahlungen[index] = { ...db.zahlungen[index], ...payload };
    saveDb(db);
    writeAuditLog('Zahlung bearbeitet', `Zahlungsdatensätze ${req.params.id} aktualisiert (Zustand: ${db.zahlungen[index].status}).`, 'Zahlungen', 'andreas.behrens@futureprofai.de', role, req);
    res.json({ success: true, item: db.zahlungen[index] });
  } else {
    res.status(404).json({ success: false, error: 'Not found' });
  }
});

app.delete('/api/zahlungen/:id', (req, res) => {
  const db = getDb();
  const role = req.body?.role || req.query?.operatorRole || 'Administrator';
  const index = db.zahlungen.findIndex(z => z.id === req.params.id);
  if (index !== -1) {
    db.zahlungen.splice(index, 1);
    saveDb(db);
    writeAuditLog('Zahlung gelöscht', `Mietrechnungsdatensatz ${req.params.id} wurde gelöscht.`, 'Zahlungen', 'andreas.behrens@futureprofai.de', role, req);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, error: 'Not found' });
  }
});


// WARTUNG (Maintenance) CRUD
app.post('/api/wartungen', (req, res) => {
  const db = getDb();
  const payload = req.body.item || req.body;
  const role = req.body.role || req.body.operatorRole || 'Administrator';
  const item = { ...payload, id: `w-${Date.now()}` };
  db.wartungen.push(item);

  // If status is scheduled, we might optionally set the space status to 'Wartung'
  if (item.status === 'Geplanter Termin') {
    const spIndex = db.stellplaetze.findIndex(s => s.id === item.stellplatzId);
    if (spIndex !== -1) {
      db.stellplaetze[spIndex].status = 'Wartung';
    }
  }

  saveDb(db);
  writeAuditLog('Wartung geplant', `Neuer Wartungstermin "${item.titel}" für Stellplatz registriert.`, 'Wartung', 'andreas.behrens@futureprofai.de', role, req);
  res.json({ success: true, item });
});

app.put('/api/wartungen/:id', (req, res) => {
  const db = getDb();
  const payload = req.body.item || req.body;
  const role = req.body.role || req.body.operatorRole || 'Administrator';
  const index = db.wartungen.findIndex(w => w.id === req.params.id);
  if (index !== -1) {
    const oldStatus = db.wartungen[index].status;
    db.wartungen[index] = { ...db.wartungen[index], ...payload };

    // If marked completed, update the garage's letzeWartung field!
    if (payload.status === 'Abgeschlossen') {
      const spIndex = db.stellplaetze.findIndex(s => s.id === db.wartungen[index].stellplatzId);
      if (spIndex !== -1) {
        db.stellplaetze[spIndex].letzteWartung = payload.datum;
        // set back to Vermietet if there's an active contract, otherwise Frei
        const hasActiveContract = db.vertraege.some(v => v.stellplatzId === db.wartungen[index].stellplatzId && v.status === 'Aktiv');
        db.stellplaetze[spIndex].status = hasActiveContract ? 'Vermietet' : 'Frei';
      }
    }

    saveDb(db);
    writeAuditLog('Wartung aktualisiert', `Wartungstermin "${db.wartungen[index].titel}" wurde auf ${db.wartungen[index].status} gesetzt.`, 'Wartung', 'andreas.behrens@futureprofai.de', role, req);
    res.json({ success: true, item: db.wartungen[index] });
  } else {
    res.status(404).json({ success: false, error: 'Not found' });
  }
});

app.delete('/api/wartungen/:id', (req, res) => {
  const db = getDb();
  const role = req.body?.role || req.query?.operatorRole || 'Administrator';
  const index = db.wartungen.findIndex(w => w.id === req.params.id);
  if (index !== -1) {
    const deleted = db.wartungen[index];
    db.wartungen.splice(index, 1);
    saveDb(db);
    writeAuditLog('Wartung gelöscht', `Wartungsbericht für ${deleted.titel} wurde gelöscht.`, 'Wartung', 'andreas.behrens@futureprofai.de', role, req);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, error: 'Not found' });
  }
});


// CUSTOM FIELDS (handles both /api/customFields and /api/custom-fields)
const handleCustomFieldAdd = (req: express.Request, res: express.Response) => {
  const db = getDb();
  const payload = req.body.item || req.body;
  const role = req.body.role || req.body.operatorRole || 'Administrator';
  const item = { ...payload, id: `cf-${Date.now()}` };
  db.customFields.push(item);
  saveDb(db);
  writeAuditLog('Benutzerdefiniertes Feld angelegt', `Feld "${item.name}" für Bereich "${item.bereich}" angelegt.`, 'Einstellungen', 'andreas.behrens@futureprofai.de', role, req);
  res.json({ success: true, item });
};

const handleCustomFieldDelete = (req: express.Request, res: express.Response) => {
  const db = getDb();
  const role = req.body?.role || req.query?.operatorRole || 'Administrator';
  const index = db.customFields.findIndex(cf => cf.id === req.params.id);
  if (index !== -1) {
    const deleted = db.customFields[index];
    db.customFields.splice(index, 1);
    saveDb(db);
    writeAuditLog('Benutzerdefiniertes Feld gelöscht', `Feld "${deleted.name}" wurde gelöscht.`, 'Einstellungen', 'andreas.behrens@futureprofai.de', role, req);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, error: 'Not found' });
  }
};

app.post('/api/customFields', handleCustomFieldAdd);
app.post('/api/custom-fields', handleCustomFieldAdd);
app.delete('/api/customFields/:id', handleCustomFieldDelete);
app.delete('/api/custom-fields/:id', handleCustomFieldDelete);


// SETTINGS UPDATE & API TOKEN & EMAIL TEMPLATES
app.post('/api/settings/templates', (req, res) => {
  const { type, template, role } = req.body;
  const db = getDb();
  if (type === 'invoice') db.settings.emailTemplateRechnung = template;
  else if (type === 'dunning') db.settings.emailTemplateMahnung = template;
  else if (type === 'maintenance') db.settings.emailTemplateWartung = template;
  saveDb(db);
  writeAuditLog('Mail-Vorlage aktualisiert', `Die E-Mail Vorlage für "${type}" wurde aktualisiert.`, 'Einstellungen', 'andreas.behrens@futureprofai.de', role, req);
  res.json({ success: true, settings: db.settings });
});

app.post('/api/settings/token', (req, res) => {
  const { token, role } = req.body;
  const db = getDb();
  db.settings.apiToken = token;
  saveDb(db);
  writeAuditLog('API-Token aktualisiert', 'Das API-Token für das externe Buchhaltungssystem wurde aktualisiert.', 'Einstellungen', 'andreas.behrens@futureprofai.de', role, req);
  res.json({ success: true, settings: db.settings });
});

app.put('/api/settings', (req, res) => {
  const db = getDb();
  const payload = req.body.item || req.body;
  const role = req.body.role || req.body.operatorRole || 'Administrator';
  db.settings = { ...db.settings, ...payload };
  saveDb(db);
  writeAuditLog('Einstellungen aktualisiert', 'Die Systemeinstellungen und Mail-Vorlagen wurden aktualisiert.', 'Einstellungen', 'andreas.behrens@futureprofai.de', role, req);
  res.json({ success: true, settings: db.settings });
});


// -------------------------------------------------------------
// CORE RECURRING AUTOMATION PROCESSES (Mietabrechnung & Mahnwesen)
// -------------------------------------------------------------

// Automated Rental Invoicing (Automatisierte Mietabrechnung)
app.post('/api/actions/generate-monthly-rent', (req, res) => {
  const { monat, operatorEmail, operatorRole } = req.body;
  if (!monat) {
    return res.status(400).json({ success: false, error: 'Monat ist erforderlich (z.B. "2026-08")' });
  }

  const db = getDb();
  const activeContracts = db.vertraege.filter(v => v.status === 'Aktiv');
  let generatedCount = 0;
  const newInvoices: Zahlung[] = [];

  activeContracts.forEach(contract => {
    // Check if an invoice for this contract and month already exists
    const exists = db.zahlungen.some(z => z.vertragsId === contract.id && z.monat === monat);
    if (!exists) {
      const mieter = db.mieter.find(m => m.id === contract.mieterId);
      const stellplatz = db.stellplaetze.find(s => s.id === contract.stellplatzId);
      const mietpreis = stellplatz ? stellplatz.mietpreis : 0;

      const faelligAm = `${monat}-03`; // Due on the 3rd of the month

      const newZahlung: Zahlung = {
        id: `z-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        vertragsId: contract.id,
        mieterId: contract.mieterId,
        stellplatzId: contract.stellplatzId,
        betrag: mietpreis,
        monat,
        faelligAm,
        status: 'Offen',
        zahlungsart: mieter?.iban ? 'Lastschrift' : 'Ueberweisung',
        bezahltAm: null,
        mahnstufe: 0,
        erstelltAm: new Date().toISOString().split('T')[0]
      };

      db.zahlungen.push(newZahlung);
      newInvoices.push(newZahlung);
      generatedCount++;

      // Trigger automatic simulated email receipt
      const mieterName = mieter ? `${mieter.vorname} ${mieter.nachname}` : 'Mieter';
      const emailText = db.settings.emailTemplateRechnung
        .replace(/{mieter_name}/g, mieterName)
        .replace(/{stellplatz_name}/g, stellplatz?.bezeichnung || '')
        .replace(/{monat}/g, monat)
        .replace(/{betrag}/g, mietpreis.toFixed(2))
        .replace(/{iban}/g, mieter?.iban || 'N/A');

      const notification: Notification = {
        id: `nt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        typ: 'Zahlung',
        betreff: `Mietrechnung ${monat} - ${stellplatz?.bezeichnung || ''}`,
        nachricht: emailText,
        empfaenger: mieter?.email || 'kunden@garagen.de',
        gesendetAm: new Date().toISOString(),
        status: 'Gesendet'
      };
      db.notifications.unshift(notification);
    }
  });

  saveDb(db);
  writeAuditLog(
    'Automatisierte Mietabrechnung',
    `Mietrechnungen für den Monat ${monat} wurden generiert. ${generatedCount} neue Rechnungen erstellt.`,
    'Zahlungen',
    operatorEmail || 'System',
    operatorRole || 'Administrator',
    req
  );

  res.json({
    success: true,
    message: `${generatedCount} Rechnungen für ${monat} generiert.`,
    count: generatedCount,
    newInvoices
  });
});

// Automated Dunning Process (Effizientes Mahnwesen)
app.post('/api/actions/run-dunning', (req, res) => {
  const { operatorEmail, operatorRole } = req.body;
  const db = getDb();
  const currentDateStr = new Date().toISOString().split('T')[0];
  let updatedCount = 0;

  db.zahlungen.forEach(z => {
    // If unpaid and past due date
    if ((z.status === 'Offen' || z.status === 'Overdue') && z.faelligAm < currentDateStr) {
      const alteMahnstufe = z.mahnstufe;
      const neueMahnstufe = Math.min(3, alteMahnstufe + 1) as 0 | 1 | 2 | 3;
      
      z.mahnstufe = neueMahnstufe;
      z.status = 'Gemahnt';
      
      // Add dunning fee
      let fee = 0;
      if (neueMahnstufe === 1) fee = db.settings.mahngebuehrStufe1;
      else if (neueMahnstufe === 2) fee = db.settings.mahngebuehrStufe2;
      else if (neueMahnstufe === 3) fee = db.settings.mahngebuehrStufe3;
      
      z.betrag = z.betrag + fee;

      updatedCount++;

      // Trigger automatic warning notification
      const mieter = db.mieter.find(m => m.id === z.mieterId);
      const stellplatz = db.stellplaetze.find(s => s.id === z.stellplatzId);
      const mieterName = mieter ? `${mieter.vorname} ${mieter.nachname}` : 'Mieter';
      const emailText = db.settings.emailTemplateMahnung
        .replace(/{mieter_name}/g, mieterName)
        .replace(/{stellplatz_name}/g, stellplatz?.bezeichnung || '')
        .replace(/{monat}/g, z.monat)
        .replace(/{betrag}/g, (z.betrag - fee).toFixed(2))
        .replace(/{mahngebuehr}/g, fee.toFixed(2))
        .replace(/{gesamtbetrag}/g, z.betrag.toFixed(2));

      const notification: Notification = {
        id: `nt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        typ: 'Zahlung',
        betreff: `Mahnung Stufe ${neueMahnstufe}: Miete ${z.monat} überfällig - ${stellplatz?.bezeichnung || ''}`,
        nachricht: emailText,
        empfaenger: mieter?.email || 'kunden@garagen.de',
        gesendetAm: new Date().toISOString(),
        status: 'Gesendet'
      };
      db.notifications.unshift(notification);
    }
  });

  saveDb(db);
  writeAuditLog(
    'Mahnwesen ausgeführt',
    `Mahnlauf ausgeführt. ${updatedCount} säumige Zahlungen gemahnt und Mahngebühren aufgeschlagen.`,
    'Zahlungen',
    operatorEmail || 'System',
    operatorRole || 'Administrator',
    req
  );

  res.json({
    success: true,
    message: `Mahnlauf abgeschlossen. ${updatedCount} Zahlungen aktualisiert.`,
    count: updatedCount
  });
});

// Create simulated notification send
app.post('/api/notifications/send-simulated', (req, res) => {
  const db = getDb();
  const notification: Notification = {
    ...req.body,
    id: `nt-${Date.now()}`,
    gesendetAm: new Date().toISOString(),
    status: 'Gesendet'
  };
  db.notifications.unshift(notification);
  saveDb(db);
  writeAuditLog('Benachrichtigung versendet', `E-Mail "${notification.betreff}" an ${notification.empfaenger} gesendet.`, 'Wartung', req.body.operatorEmail, req.body.operatorRole, req);
  res.json(notification);
});


// -------------------------------------------------------------
// VITE DEV / PRODUCTION MIDDLEWARE
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
