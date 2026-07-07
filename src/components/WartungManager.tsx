import React, { useState, useMemo } from 'react';
import { 
  Wrench, 
  Calendar, 
  Sparkles, 
  User, 
  Euro, 
  Clipboard, 
  CheckSquare, 
  Clock, 
  Trash2, 
  Plus, 
  Activity,
  AlertTriangle
} from 'lucide-react';
import { WartungsEintrag, DbSchema } from '../types';

interface WartungManagerProps {
  db: DbSchema;
  role: 'Administrator' | 'Nutzer';
  onAddWartung: (item: Omit<WartungsEintrag, 'id'>) => void;
  onEditWartung: (id: string, item: Partial<WartungsEintrag>) => void;
  onDeleteWartung: (id: string) => void;
}

export default function WartungManager({
  db,
  role,
  onAddWartung,
  onEditWartung,
  onDeleteWartung
}: WartungManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [stellplatzId, setStellplatzId] = useState('');
  const [datum, setDatum] = useState('2026-07-01');
  const [titel, setTitel] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [kosten, setKosten] = useState(120);
  const [durchgefuehrtVon, setDurchgefuehrtVon] = useState('');
  const [status, setStatus] = useState<'Geplanter Termin' | 'Abgeschlossen'>('Geplanter Termin');

  const statistics = useMemo(() => {
    const totalCost = db.wartungen
      .filter(w => w.status === 'Abgeschlossen')
      .reduce((sum, w) => sum + w.kosten, 0);
    const completedCount = db.wartungen.filter(w => w.status === 'Abgeschlossen').length;
    const plannedCount = db.wartungen.filter(w => w.status === 'Geplanter Termin').length;

    return {
      totalCost,
      completedCount,
      plannedCount
    };
  }, [db]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stellplatzId || !titel || !datum) return;

    onAddWartung({
      stellplatzId,
      datum,
      titel,
      beschreibung,
      kosten: Number(kosten),
      durchgefuehrtVon,
      status
    });

    setShowModal(false);
  };

  const handleMarkAsDone = (w: WartungsEintrag) => {
    onEditWartung(w.id, {
      status: 'Abgeschlossen',
      datum: new Date().toISOString().split('T')[0] // Done today
    });
  };

  return (
    <div className="space-y-6" id="wartung-section">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">
            Instandhaltungs- & Wartungsmanagement
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Überwachen Sie gesetzliche Prüfungsfristen, geplante Modernisierungen und Reparaturhistorien.
          </p>
        </div>
        {role === 'Administrator' && (
          <button
            onClick={() => {
              setStellplatzId(db.stellplaetze[0]?.id || '');
              setTitel('');
              setBeschreibung('');
              setKosten(120);
              setDurchgefuehrtVon('');
              setStatus('Geplanter Termin');
              setDatum(new Date().toISOString().split('T')[0]);
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 self-start sm:self-center bg-gray-900 hover:bg-gray-800 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Wartung einplanen</span>
          </button>
        )}
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200/60 shadow-2xs">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Erledigte Wartungen</div>
          <div className="text-lg font-bold text-gray-900 mt-1">{statistics.completedCount} Einsätze</div>
          <p className="text-[10px] text-gray-400 mt-0.5">Dokumentierte Instandhaltungen</p>
        </div>
        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/80 shadow-2xs">
          <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Geplante Termine</div>
          <div className="text-lg font-bold text-amber-800 mt-1">{statistics.plannedCount} Termine</div>
          <p className="text-[10px] text-amber-500 font-semibold mt-0.5">Ausstehende Rolltor- & Brandschutzprüfungen</p>
        </div>
        <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100/80 shadow-2xs">
          <div className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Investierte Gesamtkosten</div>
          <div className="text-lg font-bold text-purple-800 mt-1">{statistics.totalCost.toLocaleString('de-DE')} €</div>
          <p className="text-[10px] text-purple-400 mt-0.5">Summe aller Handwerker- und Serviceleistungen</p>
        </div>
      </div>

      {/* Main layout: Split into planned and completed logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Planned Inspections */}
        <div className="bg-white rounded-xl border border-gray-200/60 p-5 space-y-4 shadow-2xs">
          <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5 border-b border-gray-150 pb-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Anstehende / Geplante Instandhaltungen
          </h3>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {db.wartungen.filter(w => w.status === 'Geplanter Termin').map(w => {
              const sp = db.stellplaetze.find(s => s.id === w.stellplatzId);
              const loc = sp ? db.standorte.find(s => s.id === sp.standortId) : null;

              return (
                <div 
                  key={w.id} 
                  className="bg-amber-50/25 border border-amber-200/60 rounded-xl p-4 space-y-3 shadow-2xs"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-900 text-xs">{w.titel}</h4>
                      <p className="text-[10px] font-mono text-gray-500 mt-0.5">
                        Objekt: {sp?.bezeichnung || 'Unbekannt'} • {loc?.name.split(' ')[0]}
                      </p>
                    </div>
                    <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600 animate-pulse" />
                      Geplant
                    </span>
                  </div>

                  {w.beschreibung && (
                    <p className="text-xs text-gray-600 leading-relaxed font-sans">{w.beschreibung}</p>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-[10px] border-t border-amber-100 pt-2.5">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>Termin: <strong>{new Date(w.datum).toLocaleDateString('de-DE')}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>Dienstleister: <strong>{w.durchgefuehrtVon || 'N/A'}</strong></span>
                    </div>
                  </div>

                  {role === 'Administrator' && (
                    <div className="flex justify-between items-center border-t border-amber-100 pt-2.5 mt-1 text-[10px]">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Euro className="w-3.5 h-3.5 text-gray-400" />
                        <span>Kalk. Kosten: <strong>{w.kosten.toFixed(2)} €</strong></span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMarkAsDone(w)}
                          className="flex items-center gap-1 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded transition-colors shadow-2xs"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>Erledigt verbuchen</span>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Einsatz löschen?')) onDeleteWartung(w.id);
                          }}
                          className="p-1 text-red-600 hover:text-red-800 bg-white hover:bg-red-50 border border-red-100 rounded"
                          title="Löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {db.wartungen.filter(w => w.status === 'Geplanter Termin').length === 0 && (
              <p className="text-xs text-gray-400 italic text-center p-8">Keine anstehenden Reparatur- oder Prüftermine vorhanden.</p>
            )}
          </div>
        </div>

        {/* Right: Completed Inspections Historie */}
        <div className="bg-white rounded-xl border border-gray-200/60 p-5 space-y-4 shadow-2xs">
          <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5 border-b border-gray-150 pb-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            Instandhaltungsverlauf / Historie
          </h3>

          <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
            {db.wartungen.filter(w => w.status === 'Abgeschlossen').map(w => {
              const sp = db.stellplaetze.find(s => s.id === w.stellplatzId);
              const loc = sp ? db.standorte.find(s => s.id === sp.standortId) : null;

              return (
                <div 
                  key={w.id} 
                  className="bg-gray-50/50 border border-gray-200/50 rounded-xl p-3.5 text-xs flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-gray-900">{w.titel}</h4>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                          Objekt: {sp?.bezeichnung} • {loc?.name.split(' ')[0]}
                        </p>
                      </div>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[8px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase">
                        Erledigt
                      </span>
                    </div>

                    {w.beschreibung && (
                      <p className="text-gray-500 text-[11px] leading-relaxed font-sans">{w.beschreibung}</p>
                    )}
                  </div>

                  <div className="flex justify-between items-center border-t border-gray-200/50 pt-2.5 mt-2.5 text-[10px] text-gray-500">
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      <span>Erledigt am: <strong>{new Date(w.datum).toLocaleDateString('de-DE')}</strong></span>
                      <span>Dienstleister: <strong>{w.durchgefuehrtVon}</strong></span>
                    </div>
                    
                    <div className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded shrink-0">
                      {w.kosten.toFixed(2)} €
                    </div>
                  </div>
                </div>
              );
            })}
            {db.wartungen.filter(w => w.status === 'Abgeschlossen').length === 0 && (
              <p className="text-xs text-gray-400 italic text-center p-8">Keine Historie vorhanden.</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-lg w-full overflow-hidden">
            <div className="bg-gray-900 p-4 text-white flex items-center justify-between">
              <h3 className="font-semibold text-sm">
                Wartungstermin / Mangel erfassen
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Ziel-Mietobjekt *</label>
                  <select
                    required
                    value={stellplatzId}
                    onChange={e => setStellplatzId(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded bg-white"
                  >
                    {db.stellplaetze.map(sp => {
                      const loc = db.standorte.find(s => s.id === sp.standortId);
                      return (
                        <option key={sp.id} value={sp.id}>
                          {sp.bezeichnung} ({loc?.name.split(' ')[0]})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Bezeichnung / Mangel *</label>
                  <input
                    type="text"
                    required
                    value={titel}
                    onChange={e => setTitel(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded"
                    placeholder="z.B. Rolltor-Feder defekt"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Geplantes Datum *</label>
                  <input
                    type="date"
                    required
                    value={datum}
                    onChange={e => setDatum(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Kosten-Schätzung (€)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={kosten}
                    onChange={e => setKosten(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Dienstleister / Firma</label>
                  <input
                    type="text"
                    value={durchgefuehrtVon}
                    onChange={e => setDurchgefuehrtVon(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded"
                    placeholder="Handwerker-Bezeichnung"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Termin-Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded bg-white"
                  >
                    <option value="Geplanter Termin">Geplant (Laufend / Gesperrt)</option>
                    <option value="Abgeschlossen">Direkt als erledigt verbuchen</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 uppercase">Details / Notiz</label>
                <textarea
                  value={beschreibung}
                  onChange={e => setBeschreibung(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded"
                  placeholder="Genaue Fehlerbeschreibung, Ersatzteilnummern..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-600 rounded text-xs hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-900 text-white rounded text-xs hover:bg-gray-800 font-semibold"
                >
                  Planung speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
