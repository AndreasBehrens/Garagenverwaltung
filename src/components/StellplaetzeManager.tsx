import React, { useState, useMemo } from 'react';
import { 
  Building, 
  Tag, 
  Euro, 
  Wrench, 
  Bolt, 
  Maximize, 
  Trash2, 
  Edit2, 
  Plus, 
  Search, 
  Filter, 
  Sparkles,
  Info
} from 'lucide-react';
import { Stellplatz, StellplatzTyp, StellplatzStatus, DbSchema } from '../types';

interface StellplaetzeManagerProps {
  db: DbSchema;
  role: 'Administrator' | 'Nutzer';
  onAddStellplatz: (item: Omit<Stellplatz, 'id'>) => void;
  onEditStellplatz: (id: string, item: Partial<Stellplatz>) => void;
  onDeleteStellplatz: (id: string) => void;
  selectedStandortFilter: string;
  setSelectedStandortFilter: (id: string) => void;
}

export default function StellplaetzeManager({
  db,
  role,
  onAddStellplatz,
  onEditStellplatz,
  onDeleteStellplatz,
  selectedStandortFilter,
  setSelectedStandortFilter
}: StellplaetzeManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typFilter, setTypFilter] = useState<string>('All');

  // Form Fields
  const [standortId, setStandortId] = useState('');
  const [bezeichnung, setBezeichnung] = useState('');
  const [typ, setTyp] = useState<StellplatzTyp>('Standard');
  const [mietpreis, setMietpreis] = useState(100);
  const [status, setStatus] = useState<StellplatzStatus>('Frei');
  const [beschreibung, setBeschreibung] = useState('');
  const [wartungsintervallMonate, setWartungsintervallMonate] = useState(12);
  const [letzteWartung, setLetzteWartung] = useState('2025-01-01');
  const [stromanschluss, setStromanschluss] = useState(false);
  const [groesse, setGroesse] = useState('6.0m x 3.0m x 2.4m');
  
  // Custom field dynamic values
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  // Filter definitions from DB
  const objectCustomFields = useMemo(() => {
    return db.customFields.filter(cf => cf.bereich === 'stellplatz');
  }, [db]);

  // Combined filtering logic
  const filteredSpaces = useMemo(() => {
    return db.stellplaetze.filter(sp => {
      const matchesStandort = selectedStandortFilter === 'All' || sp.standortId === selectedStandortFilter;
      const matchesStatus = statusFilter === 'All' || sp.status === statusFilter;
      const matchesTyp = typFilter === 'All' || sp.typ === typFilter;
      const matchesSearch = sp.bezeichnung.toLowerCase().includes(search.toLowerCase()) || 
                            sp.beschreibung.toLowerCase().includes(search.toLowerCase());
      
      return matchesStandort && matchesStatus && matchesTyp && matchesSearch;
    });
  }, [db, selectedStandortFilter, statusFilter, typFilter, search]);

  const openAddModal = () => {
    setEditingId(null);
    setStandortId(db.standorte[0]?.id || '');
    setBezeichnung('');
    setTyp('Standard');
    setMietpreis(100);
    setStatus('Frei');
    setBeschreibung('');
    setWartungsintervallMonate(12);
    setLetzteWartung(new Date().toISOString().split('T')[0]);
    setStromanschluss(false);
    setGroesse('6.0m x 3.0m x 2.4m');
    
    // Initialize custom field default values
    const initialCf: Record<string, string> = {};
    objectCustomFields.forEach(cf => {
      initialCf[cf.name] = cf.standardwert || '';
    });
    setCustomFieldValues(initialCf);

    setShowModal(true);
  };

  const openEditModal = (sp: Stellplatz) => {
    setEditingId(sp.id);
    setStandortId(sp.standortId);
    setBezeichnung(sp.bezeichnung);
    setTyp(sp.typ);
    setMietpreis(sp.mietpreis);
    setStatus(sp.status);
    setBeschreibung(sp.beschreibung);
    setWartungsintervallMonate(sp.wartungsintervallMonate);
    setLetzteWartung(sp.letzteWartung);
    setStromanschluss(sp.stromanschluss);
    setGroesse(sp.groesse);

    // Initialize custom field existing values
    const initialCf: Record<string, string> = {};
    objectCustomFields.forEach(cf => {
      initialCf[cf.name] = sp.customFields[cf.name] || '';
    });
    setCustomFieldValues(initialCf);

    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bezeichnung || !standortId) return;

    const payload = {
      standortId,
      bezeichnung,
      typ,
      mietpreis: Number(mietpreis),
      status,
      beschreibung,
      wartungsintervallMonate: Number(wartungsintervallMonate),
      letzteWartung,
      stromanschluss,
      groesse,
      customFields: customFieldValues
    };

    if (editingId) {
      onEditStellplatz(editingId, payload);
    } else {
      onAddStellplatz(payload);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string, name: string) => {
    const isRented = db.vertraege.some(v => v.stellplatzId === id && v.status === 'Aktiv');
    if (isRented) {
      alert(`Der Stellplatz "${name}" kann nicht gelöscht werden, da er derzeit aktiv vermietet ist. Bitte kündigen Sie den Vertrag zuerst.`);
      return;
    }
    if (confirm(`Sind Sie sicher, dass Sie den Stellplatz "${name}" löschen möchten?`)) {
      onDeleteStellplatz(id);
    }
  };

  // Maintenance indicator helper
  const getWartungStatus = (sp: Stellplatz) => {
    const lastDate = new Date(sp.letzteWartung);
    const nextDate = new Date(lastDate);
    nextDate.setMonth(nextDate.getMonth() + sp.wartungsintervallMonate);
    const today = new Date();
    
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { label: 'Überfällig', color: 'text-red-600 bg-red-50 border-red-100', critical: true };
    } else if (diffDays <= 30) {
      return { label: 'In Kürze', color: 'text-amber-600 bg-amber-50 border-amber-100', critical: false };
    } else {
      return { label: 'OK', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', critical: false };
    }
  };

  return (
    <div className="space-y-6" id="stellplaetze-section">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">
            Stellplatz- & Garagenübersicht ({filteredSpaces.length})
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Überwachen Sie Belegung, Wartung und benutzerdefinierte Ausstattungen.
          </p>
        </div>
        {role === 'Administrator' && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 self-start sm:self-center bg-gray-900 hover:bg-gray-800 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Neuer Stellplatz</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-200/60 p-4 rounded-xl flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
            placeholder="Suchen nach Garage, Nr., Beschreibung..."
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Standort Filter */}
          <div className="flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <select
              value={selectedStandortFilter}
              onChange={e => setSelectedStandortFilter(e.target.value)}
              className="text-xs p-2.5 border border-gray-300 rounded-lg w-full focus:outline-none bg-white"
            >
              <option value="All">Alle Standorte</option>
              {db.standorte.map(st => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs p-2.5 border border-gray-300 rounded-lg w-full focus:outline-none bg-white"
            >
              <option value="All">Alle Status</option>
              <option value="Frei">Frei</option>
              <option value="Vermietet">Vermietet</option>
              <option value="Wartung">Wartung</option>
            </select>
          </div>

          {/* Typ Filter */}
          <div className="flex items-center gap-1.5">
            <Maximize className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <select
              value={typFilter}
              onChange={e => setTypFilter(e.target.value)}
              className="text-xs p-2.5 border border-gray-300 rounded-lg w-full focus:outline-none bg-white"
            >
              <option value="All">Alle Typen</option>
              <option value="Standard">Standard</option>
              <option value="XXL">XXL</option>
              <option value="Motorrad">Motorrad</option>
              <option value="Stellplatz">Stellplatz</option>
              <option value="Halle">Halle</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSpaces.map(sp => {
          const loc = db.standorte.find(s => s.id === sp.standortId);
          const activeVertrag = db.vertraege.find(v => v.stellplatzId === sp.id && v.status === 'Aktiv');
          const mieter = activeVertrag ? db.mieter.find(m => m.id === activeVertrag.mieterId) : null;
          
          const wStat = getWartungStatus(sp);

          return (
            <div 
              key={sp.id} 
              className={`bg-white rounded-xl border p-5 space-y-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between ${
                sp.status === 'Wartung' ? 'border-amber-200 bg-amber-50/10' : 'border-gray-200/60'
              }`}
            >
              <div className="space-y-3">
                {/* Header (Title, Type and Status) */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug">
                      {sp.bezeichnung}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5 flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      {loc ? loc.name : 'Unbekannt'}
                    </p>
                  </div>

                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    sp.status === 'Frei' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    sp.status === 'Vermietet' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                    'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {sp.status}
                  </span>
                </div>

                {/* Main attributes badges */}
                <div className="flex flex-wrap gap-2 text-[10px]">
                  <span className="bg-gray-100 border border-gray-200 text-gray-600 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                    <Maximize className="w-3 h-3" />
                    {sp.groesse}
                  </span>
                  <span className="bg-gray-100 border border-gray-200 text-gray-600 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                    <Tag className="w-3 h-3" />
                    {sp.typ}
                  </span>
                  {sp.stromanschluss && (
                    <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded flex items-center gap-1 font-mono font-semibold">
                      <Bolt className="w-3 h-3" />
                      230V Strom
                    </span>
                  )}
                </div>

                {/* Description */}
                {sp.beschreibung && (
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                    {sp.beschreibung}
                  </p>
                )}

                {/* Custom Fields Output (Custom Fields for Garage) */}
                {Object.keys(sp.customFields).length > 0 && (
                  <div className="bg-gray-50 border border-gray-100/80 p-2.5 rounded-lg space-y-1.5">
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-gray-400" />
                      Anpassbare Felder
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                      {Object.entries(sp.customFields).map(([key, val]) => (
                        <div key={key} className="flex justify-between border-b border-gray-200/40 pb-0.5">
                          <span className="text-gray-400">{key}:</span>
                          <span className="font-semibold text-gray-700 truncate max-w-[80px]" title={String(val)}>
                            {String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Linked Tenant */}
                {mieter ? (
                  <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-2.5 text-[11px] flex items-center justify-between">
                    <div>
                      <div className="text-gray-400 text-[9px] uppercase tracking-wider font-semibold">Aktiver Mieter</div>
                      <div className="font-semibold text-blue-900 mt-0.5">
                        {mieter.vorname} {mieter.nachname}
                      </div>
                    </div>
                    {mieter.firma && (
                      <span className="text-[10px] text-blue-700 font-medium px-2 py-0.5 bg-white border border-blue-100 rounded">
                        Gewerbe
                      </span>
                    )}
                  </div>
                ) : sp.status === 'Frei' ? (
                  <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-2.5 text-[10px] text-gray-400 text-center italic">
                    Keine aktive Vermietung
                  </div>
                ) : null}
              </div>

              {/* Price and Maintenance Footer */}
              <div className="pt-3 border-t border-gray-100 mt-3 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  {/* Price */}
                  <div className="flex items-center gap-1">
                    <Euro className="w-4 h-4 text-gray-400" />
                    <span className="font-bold text-gray-900 text-base">{sp.mietpreis.toFixed(2)}</span>
                    <span className="text-[10px] text-gray-400 font-medium">/ Monat</span>
                  </div>

                  {/* Maintenance Indicator */}
                  <div className="flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-gray-400" />
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold border ${wStat.color}`}>
                      Wartung: {wStat.label}
                    </span>
                  </div>
                </div>

                {role === 'Administrator' && (
                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      onClick={() => openEditModal(sp)}
                      className="flex items-center gap-1 text-[10px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Bearbeiten</span>
                    </button>
                    <button
                      onClick={() => handleDelete(sp.id, sp.bezeichnung)}
                      className="flex items-center gap-1 text-[10px] font-semibold bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Löschen</span>
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
                {editingId ? 'Stellplatz bearbeiten' : 'Neuen Stellplatz anlegen'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Standort *</label>
                  <select
                    required
                    value={standortId}
                    onChange={e => setStandortId(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-900 bg-white"
                  >
                    {db.standorte.map(st => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Bezeichnung *</label>
                  <input
                    type="text"
                    required
                    value={bezeichnung}
                    onChange={e => setBezeichnung(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                    placeholder="z.B. Garage B-08"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Typ *</label>
                  <select
                    required
                    value={typ}
                    onChange={e => setTyp(e.target.value as StellplatzTyp)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-900 bg-white"
                  >
                    <option value="Standard">Standard</option>
                    <option value="XXL">XXL</option>
                    <option value="Motorrad">Motorrad</option>
                    <option value="Stellplatz">Stellplatz</option>
                    <option value="Halle">Halle</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Mietpreis (monatlich) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={mietpreis}
                    onChange={e => setMietpreis(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Dimensionen / Größe *</label>
                  <input
                    type="text"
                    required
                    value={groesse}
                    onChange={e => setGroesse(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                    placeholder="6.0m x 3.0m x 2.4m"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Status *</label>
                  <select
                    required
                    value={status}
                    onChange={e => setStatus(e.target.value as StellplatzStatus)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-900 bg-white"
                  >
                    <option value="Frei">Frei</option>
                    <option value="Vermietet">Vermietet</option>
                    <option value="Wartung">Wartung</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Wartungsintervall (Monate) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={wartungsintervallMonate}
                    onChange={e => setWartungsintervallMonate(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Letzte Wartung *</label>
                  <input
                    type="date"
                    required
                    value={letzteWartung}
                    onChange={e => setLetzteWartung(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="stromanschluss"
                  checked={stromanschluss}
                  onChange={e => setStromanschluss(e.target.checked)}
                  className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                />
                <label htmlFor="stromanschluss" className="text-xs font-semibold text-gray-700">
                  ⚡ 230V Stromanschluss vorhanden
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 uppercase">Beschreibung</label>
                <textarea
                  value={beschreibung}
                  onChange={e => setBeschreibung(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                  placeholder="Zusätzliche Merkmale, Besonderheiten..."
                />
              </div>

              {/* Dynamic rendering of Custom Fields (Benutzerdefinierte Felder) */}
              {objectCustomFields.length > 0 && (
                <div className="border-t border-gray-150 pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Benutzerdefinierte Felder
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {objectCustomFields.map(cf => (
                      <div key={cf.id} className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600">{cf.name}</label>
                        {cf.typ === 'boolean' ? (
                          <select
                            value={customFieldValues[cf.name] || ''}
                            onChange={e => setCustomFieldValues({
                              ...customFieldValues,
                              [cf.name]: e.target.value
                            })}
                            className="w-full text-xs p-2.5 border border-gray-300 rounded bg-white"
                          >
                            <option value="Nein">Nein</option>
                            <option value="Ja">Ja</option>
                          </select>
                        ) : cf.typ === 'date' ? (
                          <input
                            type="date"
                            value={customFieldValues[cf.name] || ''}
                            onChange={e => setCustomFieldValues({
                              ...customFieldValues,
                              [cf.name]: e.target.value
                            })}
                            className="w-full text-xs p-2.5 border border-gray-300 rounded"
                          />
                        ) : cf.typ === 'number' ? (
                          <input
                            type="number"
                            value={customFieldValues[cf.name] || ''}
                            onChange={e => setCustomFieldValues({
                              ...customFieldValues,
                              [cf.name]: e.target.value
                            })}
                            className="w-full text-xs p-2.5 border border-gray-300 rounded"
                          />
                        ) : (
                          <input
                            type="text"
                            value={customFieldValues[cf.name] || ''}
                            onChange={e => setCustomFieldValues({
                              ...customFieldValues,
                              [cf.name]: e.target.value
                            })}
                            className="w-full text-xs p-2.5 border border-gray-300 rounded"
                            placeholder="Wert eingeben..."
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
