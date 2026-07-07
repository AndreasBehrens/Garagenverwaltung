import React, { useState, useMemo } from 'react';
import { Building2, MapPin, Eye, Edit2, Trash2, Plus, Info } from 'lucide-react';
import { Standort, DbSchema } from '../types';

interface StandorteManagerProps {
  db: DbSchema;
  role: 'Administrator' | 'Nutzer';
  onAddStandort: (item: Omit<Standort, 'id'>) => void;
  onEditStandort: (id: string, item: Partial<Standort>) => void;
  onDeleteStandort: (id: string) => void;
  setActiveTab: (tab: string) => void;
  setSelectedStandortFilter: (id: string) => void;
}

export default function StandorteManager({
  db,
  role,
  onAddStandort,
  onEditStandort,
  onDeleteStandort,
  setActiveTab,
  setSelectedStandortFilter
}: StandorteManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form States
  const [name, setName] = useState('');
  const [adresse, setAdresse] = useState('');
  const [plz, setPlz] = useState('');
  const [ort, setOrt] = useState('');
  const [beschreibung, setBeschreibung] = useState('');

  const stats = useMemo(() => {
    return db.standorte.map(st => {
      const spaces = db.stellplaetze.filter(s => s.standortId === st.id);
      const total = spaces.length;
      const rented = spaces.filter(s => s.status === 'Vermietet').length;
      const maintenance = spaces.filter(s => s.status === 'Wartung').length;
      const free = total - rented - maintenance;
      const rate = total > 0 ? Math.round((rented / total) * 100) : 0;
      
      const monthlyRevenue = spaces
        .filter(s => s.status === 'Vermietet')
        .reduce((sum, s) => sum + s.mietpreis, 0);

      return {
        id: st.id,
        total,
        rented,
        maintenance,
        free,
        rate,
        monthlyRevenue
      };
    });
  }, [db]);

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setAdresse('');
    setPlz('');
    setOrt('');
    setBeschreibung('');
    setShowModal(true);
  };

  const openEditModal = (st: Standort) => {
    setEditingId(st.id);
    setName(st.name);
    setAdresse(st.adresse);
    setPlz(st.plz);
    setOrt(st.ort);
    setBeschreibung(st.beschreibung);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !adresse || !plz || !ort) return;

    const payload = { name, adresse, plz, ort, beschreibung };

    if (editingId) {
      onEditStandort(editingId, payload);
    } else {
      onAddStandort(payload);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string, name: string) => {
    const spacesCount = db.stellplaetze.filter(s => s.standortId === id).length;
    if (spacesCount > 0) {
      alert(`Dieser Standort kann nicht gelöscht werden, da ihm noch ${spacesCount} Stellplätze zugewiesen sind. Bitte löschen oder verschieben Sie diese zuerst.`);
      return;
    }
    if (confirm(`Sind Sie sicher, dass Sie den Standort "${name}" löschen möchten?`)) {
      onDeleteStandort(id);
    }
  };

  return (
    <div className="space-y-6" id="standorte-section">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">
            Standortverwaltung ({db.standorte.length})
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Erfassen und bearbeiten Sie Ihre Garagenanlagen, Höfe und Parkhäuser.
          </p>
        </div>
        {role === 'Administrator' && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 self-start sm:self-center bg-gray-900 hover:bg-gray-800 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Neuer Standort</span>
          </button>
        )}
      </div>

      {/* Standorte Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {db.standorte.map(st => {
          const stStat = stats.find(s => s.id === st.id) || {
            total: 0,
            rented: 0,
            maintenance: 0,
            free: 0,
            rate: 0,
            monthlyRevenue: 0
          };

          return (
            <div 
              key={st.id} 
              className="bg-white rounded-xl border border-gray-200/60 shadow-xs hover:shadow-md hover:border-gray-300 flex flex-col justify-between overflow-hidden transition-all duration-200"
            >
              {/* Card Header Banner (Ambient Accent) */}
              <div className="h-2 bg-gray-150 bg-gradient-to-r from-gray-800 to-gray-500"></div>

              <div className="p-5 space-y-4 flex-1">
                {/* Title */}
                <div>
                  <h3 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    {st.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 font-mono">
                    <MapPin className="w-3 h-3" />
                    {st.adresse}, {st.plz} {st.ort}
                  </p>
                </div>

                {/* Description */}
                {st.beschreibung && (
                  <p className="text-xs text-gray-500 leading-relaxed bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    {st.beschreibung}
                  </p>
                )}

                {/* Occupancy Indicator */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-gray-500 font-medium">Auslastung</span>
                    <span className="font-bold text-gray-900">{stStat.rate}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        stStat.rate > 85 ? 'bg-emerald-500' : stStat.rate > 50 ? 'bg-blue-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${stStat.rate}%` }}
                    ></div>
                  </div>
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-4 gap-2 bg-gray-50/50 p-2 border border-gray-100 rounded-lg text-center text-[10px]">
                  <div>
                    <div className="text-gray-400 font-medium uppercase">Gesamt</div>
                    <div className="text-sm font-bold text-gray-800 mt-0.5">{stStat.total}</div>
                  </div>
                  <div>
                    <div className="text-blue-500 font-medium uppercase">Verm.</div>
                    <div className="text-sm font-bold text-blue-800 mt-0.5">{stStat.rented}</div>
                  </div>
                  <div>
                    <div className="text-emerald-500 font-medium uppercase">Frei</div>
                    <div className="text-sm font-bold text-emerald-800 mt-0.5">{stStat.free}</div>
                  </div>
                  <div>
                    <div className="text-amber-500 font-medium uppercase">Wartung</div>
                    <div className="text-sm font-bold text-amber-800 mt-0.5">{stStat.maintenance}</div>
                  </div>
                </div>

                {/* Rent revenue preview */}
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-500">Soll-Umsatz / Monat:</span>
                  <span className="text-xs font-bold text-gray-900 bg-gray-50 px-2 py-1 rounded">
                    {stStat.monthlyRevenue.toLocaleString('de-DE')} €
                  </span>
                </div>
              </div>

              {/* Action Footer */}
              <div className="bg-gray-50 p-3.5 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    setSelectedStandortFilter(st.id);
                    setActiveTab('stellplaetze');
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Stellplätze ansehen</span>
                </button>

                {role === 'Administrator' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(st)}
                      className="p-1.5 text-gray-500 hover:text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded"
                      title="Standort bearbeiten"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(st.id, st.name)}
                      className="p-1.5 text-red-500 hover:text-red-700 bg-white hover:bg-red-50 border border-gray-200 rounded"
                      title="Standort löschen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-lg w-full overflow-hidden">
            <div className="bg-gray-900 p-4 text-white flex items-center justify-between">
              <h3 className="font-semibold text-sm">
                {editingId ? 'Standort bearbeiten' : 'Neuen Standort anlegen'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 uppercase">Bezeichnung *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                  placeholder="z.B. Zentrum West (Parkhaus Leibniz)"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 uppercase">Adresse *</label>
                <input
                  type="text"
                  required
                  value={adresse}
                  onChange={e => setAdresse(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                  placeholder="z.B. Leibnizstraße 14"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">PLZ *</label>
                  <input
                    type="text"
                    required
                    value={plz}
                    onChange={e => setPlz(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                    placeholder="04105"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Ort *</label>
                  <input
                    type="text"
                    required
                    value={ort}
                    onChange={e => setOrt(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                    placeholder="Leipzig"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 uppercase">Beschreibung / Lage</label>
                <textarea
                  value={beschreibung}
                  onChange={e => setBeschreibung(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                  placeholder="Details zur Garage (Videoüberwachung, Rolltor, etc.)"
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
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
