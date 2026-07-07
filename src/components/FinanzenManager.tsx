import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  Search, 
  Check, 
  AlertCircle, 
  Coins, 
  Calculator, 
  Sparkles, 
  Mail, 
  Undo, 
  Trash2, 
  ArrowUpRight, 
  FileCheck2,
  Hourglass,
  Percent,
  CheckSquare
} from 'lucide-react';
import { Zahlung, ZahlungStatus, Zahlungsart, DbSchema } from '../types';

interface FinanzenManagerProps {
  db: DbSchema;
  role: 'Administrator' | 'Nutzer';
  onAddZahlung: (item: Omit<Zahlung, 'id'>) => void;
  onEditZahlung: (id: string, item: Partial<Zahlung>) => void;
  onDeleteZahlung: (id: string) => void;
  onTriggerMonthlyRent: (monat: string) => Promise<{ count: number; message: string }>;
  onTriggerDunning: () => Promise<{ count: number; message: string }>;
  refreshData: () => void;
}

export default function FinanzenManager({
  db,
  role,
  onAddZahlung,
  onEditZahlung,
  onDeleteZahlung,
  onTriggerMonthlyRent,
  onTriggerDunning,
  refreshData
}: FinanzenManagerProps) {
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [monthFilter, setMonthFilter] = useState<string>('All');

  // Automation Form states
  const [billingMonth, setBillingMonth] = useState('2026-08');
  const [isAbrechnungLoading, setIsAbrechnungLoading] = useState(false);
  const [isDunningLoading, setIsDunningLoading] = useState(false);

  // Manual payment states
  const [showManualModal, setShowManualModal] = useState(false);
  const [vertragsId, setVertragsId] = useState('');
  const [betrag, setBetrag] = useState(100);
  const [monat, setMonat] = useState('2026-07');
  const [faelligAm, setFaelligAm] = useState('2026-07-03');
  const [zahlungsart, setZahlungsart] = useState<Zahlungsart>('Ueberweisung');

  // Calculations
  const metrics = useMemo(() => {
    const totalGenerated = db.zahlungen.reduce((sum, z) => sum + z.betrag, 0);
    const paid = db.zahlungen.filter(z => z.status === 'Bezahlt').reduce((sum, z) => sum + z.betrag, 0);
    const open = db.zahlungen.filter(z => z.status === 'Offen').reduce((sum, z) => sum + z.betrag, 0);
    const overdue = db.zahlungen.filter(z => z.status === 'Overdue' || z.status === 'Gemahnt').reduce((sum, z) => sum + z.betrag, 0);
    
    return {
      totalGenerated,
      paid,
      open,
      overdue
    };
  }, [db]);

  // Unique months list for dropdown
  const monthsList = useMemo(() => {
    const monthsSet = new Set<string>();
    db.zahlungen.forEach(z => monthsSet.add(z.monat));
    return Array.from(monthsSet).sort().reverse();
  }, [db]);

  const filteredPayments = useMemo(() => {
    return db.zahlungen.filter(z => {
      const mieter = db.mieter.find(m => m.id === z.mieterId);
      const sp = db.stellplaetze.find(s => s.id === z.stellplatzId);
      
      const matchesSearch = `${mieter?.vorname} ${mieter?.nachname} ${sp?.bezeichnung || ''} ${z.monat}`.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All' || z.status === statusFilter;
      const matchesMonth = monthFilter === 'All' || z.monat === monthFilter;

      return matchesSearch && matchesStatus && matchesMonth;
    });
  }, [db, search, statusFilter, monthFilter]);

  // Automated rent run trigger
  const handleAbrechnungRun = async () => {
    if (!billingMonth) return;
    setIsAbrechnungLoading(true);
    try {
      const res = await onTriggerMonthlyRent(billingMonth);
      alert(res.message);
      refreshData();
    } catch (e) {
      alert('Abrechnungslauf fehlgeschlagen.');
    } finally {
      setIsAbrechnungLoading(false);
    }
  };

  // Automated dunning run trigger
  const handleDunningRun = async () => {
    if (!confirm('Möchten Sie das automatisierte Mahnwesen jetzt ausführen? Dadurch werden alle fälligen offenen Zahlungen ermittelt, Mahngebühren aufgeschlagen und Mahnschreiben generiert.')) return;
    setIsDunningLoading(true);
    try {
      const res = await onTriggerDunning();
      alert(res.message);
      refreshData();
    } catch (e) {
      alert('Mahnlauf fehlgeschlagen.');
    } finally {
      setIsDunningLoading(false);
    }
  };

  const handleMarkAsPaid = (payment: Zahlung) => {
    onEditZahlung(payment.id, {
      status: 'Bezahlt',
      bezahltAm: new Date().toISOString().split('T')[0]
    });
  };

  const handleManualInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vertragsId) return;

    const contract = db.vertraege.find(v => v.id === vertragsId);
    if (!contract) return;

    onAddZahlung({
      vertragsId: contract.id,
      mieterId: contract.mieterId,
      stellplatzId: contract.stellplatzId,
      betrag: Number(betrag),
      monat,
      faelligAm,
      status: 'Offen',
      zahlungsart,
      bezahltAm: null,
      mahnstufe: 0,
      erstelltAm: new Date().toISOString().split('T')[0]
    });

    setShowManualModal(false);
  };

  return (
    <div className="space-y-6" id="finanzen-section">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">
            Abrechnung & Mahnwesen
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Generieren Sie monatliche Mieten, überwachen Sie Zahlungseingänge und verwalten Sie Rückstände.
          </p>
        </div>
        {role === 'Administrator' && (
          <button
            onClick={() => {
              setVertragsId(db.vertraege[0]?.id || '');
              setShowManualModal(true);
            }}
            className="flex items-center gap-1.5 self-start sm:self-center bg-gray-900 hover:bg-gray-800 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-colors"
          >
            <Calculator className="w-4 h-4" />
            <span>Manuelle Rechnung erstellen</span>
          </button>
        )}
      </div>

      {/* Financial Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200/60 shadow-2xs">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mietzins Soll (Gesamt)</div>
          <div className="text-lg font-bold text-gray-900 mt-1">{metrics.totalGenerated.toLocaleString('de-DE')} €</div>
          <p className="text-[10px] text-gray-400 mt-0.5">Summe aller erstellten Rechnungen</p>
        </div>
        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/80 shadow-2xs">
          <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Erhaltene Mieten</div>
          <div className="text-lg font-bold text-emerald-800 mt-1">{metrics.paid.toLocaleString('de-DE')} €</div>
          <p className="text-[10px] text-emerald-600 mt-0.5">Verbucht und abgeschlossen</p>
        </div>
        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/80 shadow-2xs">
          <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Offener Posten (Laufend)</div>
          <div className="text-lg font-bold text-blue-800 mt-1">{metrics.open.toLocaleString('de-DE')} €</div>
          <p className="text-[10px] text-blue-400 mt-0.5">Zahlungsfrist noch aktiv</p>
        </div>
        <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100/80 shadow-2xs">
          <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Säumnisse / Mahnungen</div>
          <div className="text-lg font-bold text-rose-800 mt-1">{metrics.overdue.toLocaleString('de-DE')} €</div>
          <p className="text-[10px] text-rose-500 font-semibold mt-0.5">Frist abgelaufen!</p>
        </div>
      </div>

      {/* -------------------------------------------------------------
          TWO AUTOMATION MODULES (Mietabrechnung & Mahnwesen)
          ------------------------------------------------------------- */}
      {role === 'Administrator' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 border border-gray-200/80 rounded-xl p-5" id="automation-tools">
          {/* Module 1: Automated Billing Run */}
          <div className="space-y-3.5 bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  Automatisierte Mietabrechnung
                </h3>
                <p className="text-[11px] text-gray-500 mt-1">
                  Generiert Rechnungen für alle <strong>aktiven Verträge</strong> für den gewählten Monat und verbucht diese.
                </p>
              </div>
              <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded">Abrechnung</span>
            </div>

            <div className="flex items-center gap-2 pt-1.5">
              <input
                type="month"
                value={billingMonth}
                onChange={e => setBillingMonth(e.target.value)}
                className="text-xs p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 bg-white"
              />
              <button
                onClick={handleAbrechnungRun}
                disabled={isAbrechnungLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3.5 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:bg-blue-300"
              >
                {isAbrechnungLoading ? 'Generiere...' : 'Mietlauf ausführen'}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Module 2: Automated Dunning Process (Mahnwesen) */}
          <div className="space-y-3.5 bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-red-600" />
                  Effizientes Mahnwesen (Mahnlauf)
                </h3>
                <p className="text-[11px] text-gray-500 mt-1">
                  Findet unbezahlte, fällige Beträge, erhöht die Mahnstufe, addiert Gebühren und sendet Mahnschreiben.
                </p>
              </div>
              <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded">Mahnwesen</span>
            </div>

            <button
              onClick={handleDunningRun}
              disabled={isDunningLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-3.5 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:bg-red-300 pt-3"
            >
              {isDunningLoading ? 'Führe Mahnlauf aus...' : 'Mahnlauf jetzt starten'}
              <Coins className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Invoice filtering controls */}
      <div className="bg-white border border-gray-200/60 p-4 rounded-xl flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
            placeholder="Suchen nach Mietername, Monat..."
          />
        </div>

        <div className="flex gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs p-2.5 border border-gray-300 rounded-lg focus:outline-none bg-white"
          >
            <option value="All">Alle Status</option>
            <option value="Bezahlt">Bezahlt</option>
            <option value="Offen">Offen</option>
            <option value="Overdue">Überfällig</option>
            <option value="Gemahnt">Gemahnt</option>
          </select>

          {/* Month filter */}
          <select
            value={monthFilter}
            onChange={e => setMonthFilter(e.target.value)}
            className="text-xs p-2.5 border border-gray-300 rounded-lg focus:outline-none bg-white"
          >
            <option value="All">Alle Monate</option>
            {monthsList.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table of Invoices */}
      <div className="bg-white border border-gray-200/60 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-950 text-white font-semibold text-[10px] uppercase tracking-wider">
                <th className="p-4">Mieter</th>
                <th className="p-4">Stellplatz</th>
                <th className="p-4">Betrag</th>
                <th className="p-4">Zeitraum</th>
                <th className="p-4">Fälligkeit</th>
                <th className="p-4">Mahnstufe</th>
                <th className="p-4">Zahlungsstatus</th>
                <th className="p-4 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayments.map(z => {
                const mieter = db.mieter.find(m => m.id === z.mieterId);
                const sp = db.stellplaetze.find(s => s.id === z.stellplatzId);

                return (
                  <tr key={z.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-gray-900">
                        {mieter ? `${mieter.vorname} ${mieter.nachname}` : 'Gelöschter Mieter'}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono">{mieter?.email}</div>
                    </td>
                    <td className="p-4 font-semibold text-gray-700">
                      {sp?.bezeichnung || 'Unbekannt'}
                    </td>
                    <td className="p-4 font-bold text-gray-900">
                      {z.betrag.toFixed(2)} €
                    </td>
                    <td className="p-4 text-gray-500 font-mono">
                      {z.monat}
                    </td>
                    <td className="p-4 text-gray-600">
                      <div>{new Date(z.faelligAm).toLocaleDateString('de-DE')}</div>
                      {z.status !== 'Bezahlt' && (
                        <div className="text-[9px] text-rose-600 font-bold">
                          {Math.ceil((new Date().getTime() - new Date(z.faelligAm).getTime()) / (1000 * 3600 * 24))} Tage überfällig
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {z.mahnstufe > 0 ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Mahnstufe {z.mahnstufe}
                        </span>
                      ) : (
                        <span className="text-gray-400">Keine</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                        z.status === 'Bezahlt' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        z.status === 'Gemahnt' ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' :
                        z.status === 'Overdue' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        'bg-blue-50 text-blue-700 border-blue-100'
                      }`}>
                        {z.status === 'Bezahlt' && <Check className="w-3.5 h-3.5 mr-0.5" />}
                        {z.status === 'Gemahnt' && <AlertCircle className="w-3.5 h-3.5 mr-0.5" />}
                        {z.status}
                      </span>
                      {z.bezahltAm && (
                        <div className="text-[9px] text-gray-400 mt-0.5 font-mono">am: {new Date(z.bezahltAm).toLocaleDateString('de-DE')}</div>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-1 whitespace-nowrap">
                      {/* Mark as Paid */}
                      {z.status !== 'Bezahlt' && role === 'Administrator' && (
                        <button
                          onClick={() => handleMarkAsPaid(z)}
                          className="p-1 text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded text-[10px] font-bold px-2 py-1 inline-flex items-center gap-1"
                          title="Zahlungseingang verbuchen"
                        >
                          <FileCheck2 className="w-3 h-3" />
                          <span>Zahlung verbuchen</span>
                        </button>
                      )}

                      {/* Manual delete of invoice */}
                      {role === 'Administrator' && (
                        <button
                          onClick={() => {
                            if (confirm('Rechnung wirklich löschen?')) onDeleteZahlung(z.id);
                          }}
                          className="p-1.5 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded inline-flex"
                          title="Löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-gray-400 italic">
                    Keine Zahlungen / Posten gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual invoice add modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-lg w-full overflow-hidden">
            <div className="bg-gray-900 p-4 text-white flex items-center justify-between">
              <h3 className="font-semibold text-sm">
                Manuelle Einzelrechnung erstellen
              </h3>
              <button 
                onClick={() => setShowManualModal(false)}
                className="text-gray-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleManualInvoiceSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 uppercase">Mietvertrag wählen *</label>
                <select
                  required
                  value={vertragsId}
                  onChange={e => setVertragsId(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-900 bg-white"
                >
                  <option value="" disabled>-- Vertrag wählen --</option>
                  {db.vertraege.map(v => {
                    const mieter = db.mieter.find(m => m.id === v.mieterId);
                    const sp = db.stellplaetze.find(s => s.id === v.stellplatzId);
                    return (
                      <option key={v.id} value={v.id}>
                        {v.vertragsNummer} - {mieter?.vorname} {mieter?.nachname} ({sp?.bezeichnung})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Betrag (€) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={betrag}
                    onChange={e => setBetrag(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Zahlungsart *</label>
                  <select
                    value={zahlungsart}
                    onChange={e => setZahlungsart(e.target.value as Zahlungsart)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded bg-white"
                  >
                    <option value="Ueberweisung">Banküberweisung</option>
                    <option value="Lastschrift">SEPA Lastschrift</option>
                    <option value="Bar">Barzahlung</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Abrechnungsmonat *</label>
                  <input
                    type="text"
                    required
                    value={monat}
                    onChange={e => setMonat(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded"
                    placeholder="YYYY-MM (z.B. 2026-07)"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Fälligkeitsdatum *</label>
                  <input
                    type="date"
                    required
                    value={faelligAm}
                    onChange={e => setFaelligAm(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-600 rounded text-xs hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-900 text-white rounded text-xs hover:bg-gray-800 font-semibold"
                >
                  Rechnung einstellen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
