import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  CreditCard, 
  Plus, 
  Edit2, 
  Trash2, 
  Sparkles,
  Link2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Mieter, DbSchema } from '../types';

interface MieterManagerProps {
  db: DbSchema;
  role: 'Administrator' | 'Nutzer';
  onAddMieter: (item: Omit<Mieter, 'id'>) => void;
  onEditMieter: (id: string, item: Partial<Mieter>) => void;
  onDeleteMieter: (id: string) => void;
  setActiveTab: (tab: string) => void;
}

export default function MieterManager({
  db,
  role,
  onAddMieter,
  onEditMieter,
  onDeleteMieter,
  setActiveTab
}: MieterManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Search filter
  const [search, setSearch] = useState('');

  // Form Fields
  const [vorname, setVorname] = useState('');
  const [nachname, setNachname] = useState('');
  const [email, setEmail] = useState('');
  const [telefon, setTelefon] = useState('');
  const [adresse, setAdresse] = useState('');
  const [plz, setPlz] = useState('');
  const [ort, setOrt] = useState('');
  const [firma, setFirma] = useState('');
  const [iban, setIban] = useState('');
  const [status, setStatus] = useState<'Aktiv' | 'Inaktiv'>('Aktiv');
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  const mieterCustomFields = useMemo(() => {
    return db.customFields.filter(cf => cf.bereich === 'mieter');
  }, [db]);

  const filteredMieter = useMemo(() => {
    return db.mieter.filter(m => {
      const searchStr = `${m.vorname} ${m.nachname} ${m.email} ${m.firma || ''} ${m.ort}`.toLowerCase();
      return searchStr.includes(search.toLowerCase());
    });
  }, [db, search]);

  const openAddModal = () => {
    setEditingId(null);
    setVorname('');
    setNachname('');
    setEmail('');
    setTelefon('');
    setAdresse('');
    setPlz('');
    setOrt('');
    setFirma('');
    setIban('');
    setStatus('Aktiv');

    const initialCf: Record<string, string> = {};
    mieterCustomFields.forEach(cf => {
      initialCf[cf.name] = cf.standardwert || '';
    });
    setCustomFieldValues(initialCf);

    setShowModal(true);
  };

  const openEditModal = (m: Mieter) => {
    setEditingId(m.id);
    setVorname(m.vorname);
    setNachname(m.nachname);
    setEmail(m.email);
    setTelefon(m.telefon);
    setAdresse(m.adresse);
    setPlz(m.plz);
    setOrt(m.ort);
    setFirma(m.firma || '');
    setIban(m.iban);
    setStatus(m.status);

    const initialCf: Record<string, string> = {};
    mieterCustomFields.forEach(cf => {
      initialCf[cf.name] = m.customFields[cf.name] || '';
    });
    setCustomFieldValues(initialCf);

    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vorname || !nachname || !email || !iban) return;

    const payload = {
      vorname,
      nachname,
      email,
      telefon,
      adresse,
      plz,
      ort,
      firma: firma || undefined,
      iban,
      status,
      customFields: customFieldValues
    };

    if (editingId) {
      onEditMieter(editingId, payload);
    } else {
      onAddMieter(payload);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string, name: string) => {
    const hasActiveContract = db.vertraege.some(v => v.mieterId === id && v.status === 'Aktiv');
    if (hasActiveContract) {
      alert(`Der Mieter "${name}" kann nicht gelöscht werden, da er derzeit einen aktiven Mietvertrag besitzt.`);
      return;
    }
    if (confirm(`Sind Sie sicher, dass Sie den Mieter "${name}" aus dem System löschen möchten?`)) {
      onDeleteMieter(id);
    }
  };

  return (
    <div className="space-y-6" id="mieter-section">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">
            Mieterverwaltung ({filteredMieter.length})
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Erfassen Sie Kontaktdaten, gewerbliche Firmen und Bankverbindungen Ihrer Mieter.
          </p>
        </div>
        {role === 'Administrator' && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 self-start sm:self-center bg-gray-900 hover:bg-gray-800 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Mieter anlegen</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-gray-200/60 p-4 rounded-xl">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
            placeholder="Suche nach Name, E-Mail, Firma, Wohnort..."
          />
        </div>
      </div>

      {/* Mieter Cards/Table Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredMieter.map(m => {
          // Find contracts for this tenant
          const tenantContracts = db.vertraege.filter(v => v.mieterId === m.id && v.status === 'Aktiv');

          return (
            <div 
              key={m.id} 
              className="bg-white rounded-xl border border-gray-200/60 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3.5">
                {/* Header Row */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400 shrink-0" />
                      {m.vorname} {m.nachname}
                    </h3>
                    {m.firma && (
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5 flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-gray-400" />
                        {m.firma}
                      </p>
                    )}
                  </div>

                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    m.status === 'Aktiv' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-100'
                  }`}>
                    {m.status === 'Aktiv' ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                    {m.status}
                  </span>
                </div>

                {/* Contact and address details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px] text-gray-600 bg-gray-50/50 p-3 rounded-lg border border-gray-100/80">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <a href={`mailto:${m.email}`} className="hover:underline text-gray-700 font-medium truncate max-w-[150px]" title={m.email}>{m.email}</a>
                    </div>
                    {m.telefon && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="text-gray-700 font-mono">{m.telefon}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-gray-700 font-medium">{m.adresse}</p>
                      <p className="text-gray-500 text-[10px]">{m.plz} {m.ort}</p>
                    </div>
                  </div>
                </div>

                {/* Bank / IBAN info */}
                <div className="text-[11px] text-gray-600 flex items-center gap-1.5 font-mono bg-gray-50/30 p-2 border border-gray-200/40 rounded-md">
                  <CreditCard className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="text-[10px] text-gray-400">SEPA IBAN:</span>
                  <span className="font-semibold text-gray-700">{m.iban}</span>
                </div>

                {/* Custom Fields */}
                {Object.keys(m.customFields).length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-gray-400" />
                      Erweiterte Mieterdaten
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      {Object.entries(m.customFields).map(([key, val]) => (
                        <div key={key} className="flex justify-between border-b border-gray-100 pb-0.5">
                          <span className="text-gray-400">{key}:</span>
                          <span className="font-semibold text-gray-700 truncate max-w-[100px]" title={String(val)}>
                            {String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active Contracts and Garages */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Aktive Mietobjekte</div>
                  {tenantContracts.length > 0 ? (
                    <div className="space-y-1">
                      {tenantContracts.map(vt => {
                        const sp = db.stellplaetze.find(s => s.id === vt.stellplatzId);
                        const loc = db.standorte.find(s => s.id === sp?.standortId);
                        return (
                          <div 
                            key={vt.id} 
                            onClick={() => setActiveTab('vertraege')}
                            className="bg-blue-50/50 hover:bg-blue-100/50 border border-blue-100 rounded p-2 text-[11px] flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <span className="font-semibold text-blue-900 flex items-center gap-1">
                              <Link2 className="w-3 h-3 text-blue-500" />
                              {sp?.bezeichnung || 'Unbekannt'} ({loc?.name.split(' ')[0]})
                            </span>
                            <span className="text-[10px] font-mono text-blue-700 font-bold bg-white px-1.5 py-0.5 border border-blue-100 rounded">
                              {vt.vertragsNummer}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-400 italic">Keine aktiven Mietobjekte zugewiesen.</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {role === 'Administrator' && (
                <div className="flex gap-2 justify-end border-t border-gray-100 pt-3 mt-1">
                  <button
                    onClick={() => openEditModal(m)}
                    className="flex items-center gap-1 text-[10px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Bearbeiten</span>
                  </button>
                  <button
                    onClick={() => handleDelete(m.id, `${m.vorname} ${m.nachname}`)}
                    className="flex items-center gap-1 text-[10px] font-semibold bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Löschen</span>
                  </button>
                </div>
              )}
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
                {editingId ? 'Mieter bearbeiten' : 'Neuen Mieter anlegen'}
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
                  <label className="text-xs font-semibold text-gray-600 uppercase">Vorname *</label>
                  <input
                    type="text"
                    required
                    value={vorname}
                    onChange={e => setVorname(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                    placeholder="Max"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Nachname *</label>
                  <input
                    type="text"
                    required
                    value={nachname}
                    onChange={e => setNachname(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                    placeholder="Mustermann"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">E-Mail *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                    placeholder="max.mustermann@web.de"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Telefon</label>
                  <input
                    type="text"
                    value={telefon}
                    onChange={e => setTelefon(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                    placeholder="+49 172 1234567"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 uppercase">Straße & Hausnr.</label>
                <input
                  type="text"
                  value={adresse}
                  onChange={e => setAdresse(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                  placeholder="Musterstraße 42"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">PLZ</label>
                  <input
                    type="text"
                    value={plz}
                    onChange={e => setPlz(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                    placeholder="04109"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Ort</label>
                  <input
                    type="text"
                    value={ort}
                    onChange={e => setOrt(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                    placeholder="Leipzig"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 uppercase">Firma (für Gewerbemietvertrag)</label>
                <input
                  type="text"
                  value={firma}
                  onChange={e => setFirma(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                  placeholder="Mustermann GmbH (optional)"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase font-mono">SEPA IBAN (Lastschrift) *</label>
                  <input
                    type="text"
                    required
                    value={iban}
                    onChange={e => setIban(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-900 font-mono"
                    placeholder="DE89..."
                  />
                </div>

                <div className="col-span-1 space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Status *</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none bg-white"
                  >
                    <option value="Aktiv">Aktiv</option>
                    <option value="Inaktiv">Inaktiv</option>
                  </select>
                </div>
              </div>

              {/* Dynamic rendering of Custom Fields (Benutzerdefinierte Felder für Mieter) */}
              {mieterCustomFields.length > 0 && (
                <div className="border-t border-gray-150 pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Benutzerdefinierte Felder
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {mieterCustomFields.map(cf => (
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
                            placeholder="Wert eintragen..."
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
