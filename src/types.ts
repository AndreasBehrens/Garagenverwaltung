export interface Standort {
  id: string;
  name: string;
  adresse: string;
  plz: string;
  ort: string;
  beschreibung: string;
}

export type StellplatzTyp = 'Standard' | 'XXL' | 'Motorrad' | 'Stellplatz' | 'Halle';
export type StellplatzStatus = 'Frei' | 'Vermietet' | 'Wartung';

export interface Stellplatz {
  id: string;
  standortId: string;
  bezeichnung: string; // e.g. "Garage A-01"
  typ: StellplatzTyp;
  mietpreis: number;
  status: StellplatzStatus;
  beschreibung: string;
  wartungsintervallMonate: number;
  letzteWartung: string; // ISO date YYYY-MM-DD
  stromanschluss: boolean;
  groesse: string; // e.g. "6.0m x 3.0m x 2.4m"
  customFields: Record<string, any>;
}

export interface Mieter {
  id: string;
  vorname: string;
  nachname: string;
  email: string;
  telefon: string;
  adresse: string;
  plz: string;
  ort: string;
  firma?: string;
  iban: string;
  status: 'Aktiv' | 'Inaktiv';
  customFields: Record<string, any>;
}

export type VertragStatus = 'Entwurf' | 'Aktiv' | 'Gekuendigt' | 'Beendet';

export interface Vertrag {
  id: string;
  stellplatzId: string;
  mieterId: string;
  startDatum: string; // ISO date
  endDatum: string | null; // ISO date, or null if open-ended
  kaution: number;
  kautionBezahlt: boolean;
  status: VertragStatus;
  kuendigungsfristMonate: number;
  dokumentUrl: string | null;
  vertragsNummer: string; // e.g. "VT-2026-0001"
  erstelltAm: string; // ISO date
  customFields: Record<string, any>;
}

export type ZahlungStatus = 'Bezahlt' | 'Offen' | 'Overdue' | 'Gemahnt';
export type Zahlungsart = 'Lastschrift' | 'Ueberweisung' | 'Bar';

export interface Zahlung {
  id: string;
  vertragsId: string;
  mieterId: string;
  stellplatzId: string;
  betrag: number;
  monat: string; // e.g. "2026-07"
  faelligAm: string; // ISO date
  status: ZahlungStatus;
  zahlungsart: Zahlungsart;
  bezahltAm: string | null; // ISO date or null
  mahnstufe: number; // 0 = none, 1 = Zahlungserinnerung, 2 = 1. Mahnung, 3 = 2. Mahnung
  erstelltAm: string; // ISO date
}

export interface WartungsEintrag {
  id: string;
  stellplatzId: string;
  datum: string; // ISO date
  titel: string;
  beschreibung: string;
  kosten: number;
  durchgefuehrtVon: string;
  status: 'Geplanter Termin' | 'Abgeschlossen';
}

export type AuditLogBereich = 'Sicherheit' | 'Mieter' | 'Verträge' | 'Zahlungen' | 'Wartung' | 'API' | 'Einstellungen';

export interface AuditLog {
  id: string;
  timestamp: string; // ISO datetime
  benutzer: string; // user email
  rolle: 'Administrator' | 'Nutzer';
  aktion: string;
  details: string;
  bereich: AuditLogBereich;
  ipAdresse: string;
}

export interface CustomFieldDefinition {
  id: string;
  name: string;
  typ: 'text' | 'number' | 'boolean' | 'date';
  bereich: 'stellplatz' | 'vertrag' | 'mieter';
  standardwert: any;
}

export interface Notification {
  id: string;
  typ: 'Zahlung' | 'Wartung' | 'System';
  betreff: string;
  nachricht: string;
  empfaenger: string;
  gesendetAm: string; // ISO datetime
  status: 'Gesendet' | 'Fehler';
}

export interface SystemSettings {
  apiToken: string;
  mahngebuehrStufe1: number;
  mahngebuehrStufe2: number;
  mahngebuehrStufe3: number;
  emailTemplateMahnung: string;
  emailTemplateRechnung: string;
  emailTemplateWartung: string;
}

export interface DbSchema {
  standorte: Standort[];
  stellplaetze: Stellplatz[];
  mieter: Mieter[];
  vertraege: Vertrag[];
  zahlungen: Zahlung[];
  wartungen: WartungsEintrag[];
  auditLogs: AuditLog[];
  customFields: CustomFieldDefinition[];
  notifications: Notification[];
  settings: SystemSettings;
}
