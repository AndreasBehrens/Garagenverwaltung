import { DbSchema } from '../types';

export const initialDbData: DbSchema = {
  standorte: [
    {
      id: 'st-01',
      name: 'Zentrum West (Parkhaus Leibniz)',
      adresse: 'Leibnizstraße 14',
      plz: '04105',
      ort: 'Leipzig',
      beschreibung: 'Moderne, helle Tiefgarage im Zentrum-West mit Videoüberwachung und elektrischem Rolltor.'
    },
    {
      id: 'st-02',
      name: 'Gewerbepark Nord-Ost',
      adresse: 'Torgauer Straße 230',
      plz: '04347',
      ort: 'Leipzig',
      beschreibung: 'Großzügiger Garagenhof im Nord-Osten. Ideal für XXL-Fahrzeuge, Transporter und als Lager.'
    },
    {
      id: 'st-03',
      name: 'Südvorstadt Quartier',
      adresse: 'Karl-Liebknecht-Straße 82',
      plz: '04275',
      ort: 'Leipzig',
      beschreibung: 'Zentrale Innenhof-Garagen in belebter Lage. Hohe Nachfrage und 100% Auslastung.'
    }
  ],
  stellplaetze: [
    {
      id: 'sp-101',
      standortId: 'st-01',
      bezeichnung: 'TG-Platz 01 (EG)',
      typ: 'Standard',
      mietpreis: 95.0,
      status: 'Vermietet',
      beschreibung: 'Standard-Stellplatz im Erdgeschoss direkt am Aufgang.',
      wartungsintervallMonate: 12,
      letzteWartung: '2025-10-15',
      stromanschluss: true,
      groesse: '5.5m x 2.8m x 2.2m',
      customFields: {
        'Zustand Rolltor': 'Sehr gut',
        'Zählerstand Strom': '1420 kWh'
      }
    },
    {
      id: 'sp-102',
      standortId: 'st-01',
      bezeichnung: 'TG-Platz 02 (EG)',
      typ: 'XXL',
      mietpreis: 125.0,
      status: 'Vermietet',
      beschreibung: 'Breiter Komfortstellplatz, geeignet für SUVs und Vans.',
      wartungsintervallMonate: 12,
      letzteWartung: '2025-10-15',
      stromanschluss: true,
      groesse: '6.0m x 3.2m x 2.2m',
      customFields: {
        'Zustand Rolltor': 'Gut',
        'Zählerstand Strom': '890 kWh'
      }
    },
    {
      id: 'sp-103',
      standortId: 'st-01',
      bezeichnung: 'TG-Platz 03 (UG)',
      typ: 'Standard',
      mietpreis: 85.0,
      status: 'Frei',
      beschreibung: 'Standard-Stellplatz im 1. Untergeschoss.',
      wartungsintervallMonate: 12,
      letzteWartung: '2025-10-18',
      stromanschluss: false,
      groesse: '5.5m x 2.8m x 2.2m',
      customFields: {}
    },
    {
      id: 'sp-104',
      standortId: 'st-01',
      bezeichnung: 'TG-Moped 01',
      typ: 'Motorrad',
      mietpreis: 40.0,
      status: 'Frei',
      beschreibung: 'Kompakter Abstellplatz für Zweiräder.',
      wartungsintervallMonate: 24,
      letzteWartung: '2024-06-05',
      stromanschluss: false,
      groesse: '2.5m x 1.5m x 2.2m',
      customFields: {}
    },
    {
      id: 'sp-201',
      standortId: 'st-02',
      bezeichnung: 'Hof-Garage 01',
      typ: 'Halle',
      mietpreis: 180.0,
      status: 'Vermietet',
      beschreibung: 'Abschließbare, hohe Halle mit eigenem Sektionaltor und Starkstrom.',
      wartungsintervallMonate: 6,
      letzteWartung: '2026-03-10',
      stromanschluss: true,
      groesse: '8.0m x 4.0m x 3.5m',
      customFields: {
        'Zustand Rolltor': 'Wartung fällig',
        'Sicherungskasten': 'Schlüssel hinterlegt'
      }
    },
    {
      id: 'sp-202',
      standortId: 'st-02',
      bezeichnung: 'Hof-Garage 02',
      typ: 'Standard',
      mietpreis: 110.0,
      status: 'Vermietet',
      beschreibung: 'Massive Einzelgarage im ruhigen Innenbereich.',
      wartungsintervallMonate: 12,
      letzteWartung: '2025-08-11',
      stromanschluss: false,
      groesse: '6.0m x 3.0m x 2.4m',
      customFields: {}
    },
    {
      id: 'sp-203',
      standortId: 'st-02',
      bezeichnung: 'Hof-Garage 03 (Dachschaden)',
      typ: 'Standard',
      mietpreis: 110.0,
      status: 'Wartung',
      beschreibung: 'Einzelgarage. Aktuell wegen Behebung einer Dachundichtigkeit gesperrt.',
      wartungsintervallMonate: 12,
      letzteWartung: '2025-05-12',
      stromanschluss: false,
      groesse: '6.0m x 3.0m x 2.4m',
      customFields: {
        'Mangel': 'Dach undicht bei Starkregen'
      }
    },
    {
      id: 'sp-301',
      standortId: 'st-03',
      bezeichnung: 'Hof-Garage A',
      typ: 'Standard',
      mietpreis: 130.0,
      status: 'Vermietet',
      beschreibung: 'Zentrale Hofgarage in der Karl-Liebknecht-Straße.',
      wartungsintervallMonate: 12,
      letzteWartung: '2025-11-20',
      stromanschluss: true,
      groesse: '5.8m x 2.9m x 2.3m',
      customFields: {
        'Zustand Rolltor': 'Sehr gut',
        'Zählerstand Strom': '2341 kWh'
      }
    },
    {
      id: 'sp-302',
      standortId: 'st-03',
      bezeichnung: 'Hof-Garage B',
      typ: 'Standard',
      mietpreis: 130.0,
      status: 'Vermietet',
      beschreibung: 'Zentrale Hofgarage im beliebten Wohnquartier.',
      wartungsintervallMonate: 12,
      letzteWartung: '2025-11-20',
      stromanschluss: false,
      groesse: '5.8m x 2.9m x 2.3m',
      customFields: {}
    }
  ],
  mieter: [
    {
      id: 'm-01',
      vorname: 'Maximilian',
      nachname: 'Müller',
      email: 'm.mueller@example.de',
      telefon: '+49 172 1234567',
      adresse: 'Sebastian-Bach-Str. 12',
      plz: '04109',
      ort: 'Leipzig',
      firma: '',
      iban: 'DE89 3704 0044 0532 0012 34',
      status: 'Aktiv',
      customFields: {
        'KFZ-Kennzeichen': 'L-MM 2026',
        'Notizen': 'Zahlt immer pünktlich per Lastschrift.'
      }
    },
    {
      id: 'm-02',
      vorname: 'Sarah',
      nachname: 'Schmidt',
      email: 'sarah.schmidt@concept-marketing.de',
      telefon: '+49 151 9876543',
      adresse: 'Gustav-Adolf-Str. 23',
      plz: '04105',
      ort: 'Leipzig',
      firma: 'Concept Marketing GmbH',
      iban: 'DE12 3006 0010 0000 7890 12',
      status: 'Aktiv',
      customFields: {
        'USt-IdNr.': 'DE814983204',
        'Notizen': 'Gewerbliche Mieterin, benötigt Rechnungsstellung.'
      }
    },
    {
      id: 'm-03',
      vorname: 'Christian',
      nachname: 'Bauer',
      email: 'c.bauer@mail.net',
      telefon: '+49 160 5556677',
      adresse: 'Kochstraße 4',
      plz: '04275',
      ort: 'Leipzig',
      firma: '',
      iban: 'DE56 8605 0000 1122 3344 55',
      status: 'Aktiv',
      customFields: {
        'KFZ-Kennzeichen': 'L-CB 987',
        'Notizen': 'Hat Zweitschlüssel für Hoftor erhalten.'
      }
    }
  ],
  vertraege: [
    {
      id: 'vt-01',
      stellplatzId: 'sp-101',
      mieterId: 'm-01',
      startDatum: '2024-01-01',
      endDatum: null,
      kaution: 200.0,
      kautionBezahlt: true,
      status: 'Aktiv',
      kuendigungsfristMonate: 3,
      dokumentUrl: '/api/vertraege/vt-01/pdf-preview',
      vertragsNummer: 'VT-24-0012',
      erstelltAm: '2023-12-15',
      customFields: {
        'Sondervereinbarungen': 'Laden von E-Bike gestattet.',
        'Kaution hinterlegt am': '2023-12-20'
      }
    },
    {
      id: 'vt-02',
      stellplatzId: 'sp-102',
      mieterId: 'm-02',
      startDatum: '2024-06-01',
      endDatum: null,
      kaution: 300.0,
      kautionBezahlt: true,
      status: 'Aktiv',
      kuendigungsfristMonate: 3,
      dokumentUrl: '/api/vertraege/vt-02/pdf-preview',
      vertragsNummer: 'VT-24-0045',
      erstelltAm: '2024-05-20',
      customFields: {
        'Sondervereinbarungen': 'Keine Lagerung von Gefahrstoffen.',
        'Kaution hinterlegt am': '2024-05-22'
      }
    },
    {
      id: 'vt-03',
      stellplatzId: 'sp-301',
      mieterId: 'm-03',
      startDatum: '2025-11-01',
      endDatum: '2026-10-31',
      kaution: 260.0,
      kautionBezahlt: true,
      status: 'Aktiv',
      kuendigungsfristMonate: 1,
      dokumentUrl: '/api/vertraege/vt-03/pdf-preview',
      vertragsNummer: 'VT-25-0091',
      erstelltAm: '2025-10-10',
      customFields: {
        'Befristungsgrund': 'Eigenbedarf wegen geplantem Umbau ab Nov 2026'
      }
    },
    {
      id: 'vt-04',
      stellplatzId: 'sp-201',
      mieterId: 'm-02',
      startDatum: '2026-04-01',
      endDatum: null,
      kaution: 400.0,
      kautionBezahlt: true,
      status: 'Aktiv',
      kuendigungsfristMonate: 3,
      dokumentUrl: '/api/vertraege/vt-04/pdf-preview',
      vertragsNummer: 'VT-26-0002',
      erstelltAm: '2026-03-15',
      customFields: {
        'Starkstrom-Nutzung': 'Inkludiert bis 100 kWh/Monat'
      }
    }
  ],
  zahlungen: [
    // Past Paid Payments
    {
      id: 'z-01',
      vertragsId: 'vt-01',
      mieterId: 'm-01',
      stellplatzId: 'sp-101',
      betrag: 95.0,
      monat: '2026-05',
      faelligAm: '2026-05-03',
      status: 'Bezahlt',
      zahlungsart: 'Lastschrift',
      bezahltAm: '2026-05-02',
      mahnstufe: 0,
      erstelltAm: '2026-05-01'
    },
    {
      id: 'z-02',
      vertragsId: 'vt-02',
      mieterId: 'm-02',
      stellplatzId: 'sp-102',
      betrag: 125.0,
      monat: '2026-05',
      faelligAm: '2026-05-03',
      status: 'Bezahlt',
      zahlungsart: 'Ueberweisung',
      bezahltAm: '2026-05-05',
      mahnstufe: 0,
      erstelltAm: '2026-05-01'
    },
    {
      id: 'z-03',
      vertragsId: 'vt-01',
      mieterId: 'm-01',
      stellplatzId: 'sp-101',
      betrag: 95.0,
      monat: '2026-06',
      faelligAm: '2026-06-03',
      status: 'Bezahlt',
      zahlungsart: 'Lastschrift',
      bezahltAm: '2026-06-02',
      mahnstufe: 0,
      erstelltAm: '2026-06-01'
    },
    {
      id: 'z-04',
      vertragsId: 'vt-02',
      mieterId: 'm-02',
      stellplatzId: 'sp-102',
      betrag: 125.0,
      monat: '2026-06',
      faelligAm: '2026-06-03',
      status: 'Bezahlt',
      zahlungsart: 'Ueberweisung',
      bezahltAm: '2026-06-05',
      mahnstufe: 0,
      erstelltAm: '2026-06-01'
    },
    // Current Due/Overdue/Dunned Payments
    {
      id: 'z-05',
      vertragsId: 'vt-01',
      mieterId: 'm-01',
      stellplatzId: 'sp-101',
      betrag: 95.0,
      monat: '2026-07',
      faelligAm: '2026-07-03',
      status: 'Bezahlt', // Since current date is 2026-07-06, let's say this was paid
      zahlungsart: 'Lastschrift',
      bezahltAm: '2026-07-02',
      mahnstufe: 0,
      erstelltAm: '2026-07-01'
    },
    {
      id: 'z-06',
      vertragsId: 'vt-02',
      mieterId: 'm-02',
      stellplatzId: 'sp-102',
      betrag: 125.0,
      monat: '2026-07',
      faelligAm: '2026-07-03',
      status: 'Overdue', // Not paid yet, overdue since 3 days
      zahlungsart: 'Ueberweisung',
      bezahltAm: null,
      mahnstufe: 1, // Received Reminder
      erstelltAm: '2026-07-01'
    },
    {
      id: 'z-07',
      vertragsId: 'vt-03',
      mieterId: 'm-03',
      stellplatzId: 'sp-301',
      betrag: 130.0,
      monat: '2026-07',
      faelligAm: '2026-07-03',
      status: 'Gemahnt', // Strictly dunned
      zahlungsart: 'Ueberweisung',
      bezahltAm: null,
      mahnstufe: 2, // 1st Warning letter
      erstelltAm: '2026-07-01'
    },
    {
      id: 'z-08',
      vertragsId: 'vt-04',
      mieterId: 'm-02',
      stellplatzId: 'sp-201',
      betrag: 180.0,
      monat: '2026-07',
      faelligAm: '2026-07-03',
      status: 'Offen',
      zahlungsart: 'Ueberweisung',
      bezahltAm: null,
      mahnstufe: 0,
      erstelltAm: '2026-07-01'
    }
  ],
  wartungen: [
    {
      id: 'w-01',
      stellplatzId: 'sp-101',
      datum: '2025-10-15',
      titel: 'Rolltor-Schmierung & Sensorprüfung',
      beschreibung: 'Laufschienen gereinigt und geschmiert. Lichtschranke neu kalibriert.',
      kosten: 120.0,
      durchgefuehrtVon: 'Tortechnik Meyer GmbH',
      status: 'Abgeschlossen'
    },
    {
      id: 'w-02',
      stellplatzId: 'sp-102',
      datum: '2025-10-15',
      titel: 'Rolltor-Schmierung & Sensorprüfung',
      beschreibung: 'Standardwartung durchgeführt. Keine Mängel.',
      kosten: 120.0,
      durchgefuehrtVon: 'Tortechnik Meyer GmbH',
      status: 'Abgeschlossen'
    },
    {
      id: 'w-03',
      stellplatzId: 'sp-201',
      datum: '2026-03-10',
      titel: 'Elektro-Check Starkstromverteiler',
      beschreibung: 'Prüfung nach DGUV V3 durchgeführt. FI-Schutzschalter getauscht.',
      kosten: 280.0,
      durchgefuehrtVon: 'Elektro-Blitz Leipzig',
      status: 'Abgeschlossen'
    },
    {
      id: 'w-04',
      stellplatzId: 'sp-203',
      datum: '2026-07-15',
      titel: 'Flachdach-Sanierung (Zwecks Undichtigkeit)',
      beschreibung: 'Austausch der Bitumenbahnen an beschädigter Nahtstelle.',
      kosten: 850.0,
      durchgefuehrtVon: 'Bedachungen Schmidt',
      status: 'Geplanter Termin'
    }
  ],
  auditLogs: [
    {
      id: 'al-01',
      timestamp: '2026-07-06T08:15:33Z',
      benutzer: 'andreas.behrens@futureprofai.de',
      rolle: 'Administrator',
      aktion: 'Benutzer-Login',
      details: 'Erfolgreiche Anmeldung im System.',
      bereich: 'Sicherheit',
      ipAdresse: '192.168.1.14'
    },
    {
      id: 'al-02',
      timestamp: '2026-07-06T09:30:12Z',
      benutzer: 'andreas.behrens@futureprofai.de',
      rolle: 'Administrator',
      aktion: 'Mieter angelegt',
      details: 'Mieter Christian Bauer (ID: m-03) erfolgreich registriert.',
      bereich: 'Mieter',
      ipAdresse: '192.168.1.14'
    },
    {
      id: 'al-03',
      timestamp: '2026-07-06T09:45:00Z',
      benutzer: 'andreas.behrens@futureprofai.de',
      rolle: 'Administrator',
      aktion: 'Vertrag generiert',
      details: 'Mietvertrag VT-25-0091 für Stellplatz sp-301 erstellt.',
      bereich: 'Verträge',
      ipAdresse: '192.168.1.14'
    },
    {
      id: 'al-04',
      timestamp: '2026-07-06T11:00:15Z',
      benutzer: 'external-accounting-bot',
      rolle: 'Nutzer',
      aktion: 'Schnittstellen-Zugriff (API)',
      details: 'Buchhaltungssystem hat Rechnungsdaten für den Monat 2026-07 abgerufen (4 Datensätze).',
      bereich: 'API',
      ipAdresse: '84.112.92.51'
    }
  ],
  customFields: [
    {
      id: 'cf-01',
      name: 'KFZ-Kennzeichen',
      typ: 'text',
      bereich: 'mieter',
      standardwert: ''
    },
    {
      id: 'cf-02',
      name: 'Zustand Rolltor',
      typ: 'text',
      bereich: 'stellplatz',
      standardwert: 'Sehr gut'
    },
    {
      id: 'cf-03',
      name: 'Zählerstand Strom',
      typ: 'text',
      bereich: 'stellplatz',
      standardwert: '0 kWh'
    }
  ],
  notifications: [
    {
      id: 'nt-01',
      typ: 'Zahlung',
      betreff: 'Mahnung Stufe 1: Miete Juli 2026 überfällig',
      nachricht: 'Sehr geehrte Frau Schmidt, hiermit weisen wir darauf hin, dass die Miete für die Garage Hof-Garage 01 fällig war.',
      empfaenger: 'sarah.schmidt@concept-marketing.de',
      gesendetAm: '2026-07-05T14:20:00Z',
      status: 'Gesendet'
    }
  ],
  settings: {
    apiToken: 'gm_live_8f3a9e2c1b7d5e4a0f6c',
    mahngebuehrStufe1: 5.0,
    mahngebuehrStufe2: 10.0,
    mahngebuehrStufe3: 15.0,
    emailTemplateMahnung: `Sehr geehrte(r) {mieter_name},

hiermit weisen wir höflich darauf hin, dass die Mietzahlung für das Mietobjekt "{stellplatz_name}" für den Monat {monat} in Höhe von {betrag} € (zzgl. {mahngebuehr} € Mahngebühr) überfällig ist.

Bitte überweisen Sie den ausstehenden Betrag von insgesamt {gesamtbetrag} € umgehend auf das bekannte Bankkonto.

Sollten Sie die Zahlung bereits veranlasst haben, betrachten Sie dieses Schreiben bitte als gegenstandslos.

Mit freundlichen Grüßen,
Ihre Garagenverwaltung`,
    emailTemplateRechnung: `Sehr geehrte(r) {mieter_name},

anbei erhalten Sie die monatliche Mietrechnung für Ihr Mietobjekt "{stellplatz_name}" für den Monat {monat} in Höhe von {betrag} €.

Der Betrag wird vereinbarungsgemäß per Lastschrift von Ihrem Konto {iban} eingezogen.

Mit freundlichen Grüßen,
Ihre Garagenverwaltung`,
    emailTemplateWartung: `Hallo {dienstleister_name},

wir beauftragen hiermit die anstehende Wartung für das Objekt "{stellplatz_name}" ({stellplatz_adresse}).
Wartungstyp: {wartung_titel}
Geplantes Intervall: Alle {intervall} Monate.

Bitte stimmen Sie den Termin mit uns ab.

Viele Grüße,
Garagenverwaltung`
  }
};
