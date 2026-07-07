import React, { useState } from 'react';
import { 
  Settings2, 
  UserCheck, 
  Sparkles, 
  Key, 
  Trash2, 
  Plus, 
  RefreshCw, 
  Building,
  Briefcase,
  FileText
} from 'lucide-react';
import { CustomFieldDefinition, DbSchema } from '../types';

interface SettingsManagerProps {
  db: DbSchema;
  role: 'Administrator' | 'Nutzer';
  onChangeRole: (role: 'Administrator' | 'Nutzer') => void;
  onAddCustomField: (field: Omit<CustomFieldDefinition, 'id'>) => void;
  onDeleteCustomField: (id: string) => void;
  onResetDb: () => void;
  onSaveToken: (token: string) => void;
}

export default function SettingsManager({
  db,
  role,
  onChangeRole,
  onAddCustomField,
  onDeleteCustomField,
  onResetDb,
  onSaveToken
}: SettingsManagerProps) {
  // New Field states
  const [fieldName, setFieldName] = useState('');
  const [fieldBereich, setFieldBereich] = useState<'stellplatz' | 'mieter' | 'vertrag'>('stellplatz');
  const [fieldTyp, setFieldTyp] = useState<'text' | 'number' | 'boolean' | 'date'>('text');
  const [fieldStandard, setFieldStandard] = useState('');

  // API Token state
  const [apiTokenInput, setApiTokenInput] = useState(db.settings.apiToken);

  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldName) return;

    onAddCustomField({
      name: fieldName,
      bereich: fieldBereich,
      typ: fieldTyp,
      standardwert: fieldStandard || undefined
    });

    setFieldName('');
    setFieldStandard('');
    alert(`Das Feld "${fieldName}" wurde erfolgreich angelegt und steht ab sofort in den Formularen bereit!`);
  };

  const handleSaveToken = () => {
    if (!apiTokenInput) return;
    onSaveToken(apiTokenInput);
    alert('API-Schlüssel wurde aktualisiert.');
  };

  return (
    <div className="space-y-6" id="settings-section">
      {/* Header */}
      <div className="border-b border-gray-100 pb-5">
        <h2 className="text-xl font-semibold tracking-tight text-gray-900">
          Systemeinstellungen & Anpassung
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Rollenberechtigungen anpassen, Datenfelder erweitern und Schnittstellen-Optionen anpassen.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Role switching and API settings */}
        <div className="space-y-6">
          
          {/* Role Switching */}
          <div className="bg-white rounded-xl border border-gray-200/60 p-5 space-y-4 shadow-2xs">
            <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5 border-b border-gray-150 pb-2">
              <UserCheck className="w-4 h-4 text-gray-400" />
              Aktive Benutzerrolle umschalten
            </h3>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Testen Sie die Benutzeroberfläche aus Sicht eines System-Administrators (Vollzugriff, Abrechnungsläufe, CRUD) 
              oder eines Sachbearbeiters / Nutzers (Lesezugriffe, Protokollierung).
            </p>

            <div className="grid grid-cols-2 gap-3 bg-gray-50 p-1.5 rounded-lg border border-gray-150">
              <button
                onClick={() => onChangeRole('Administrator')}
                className={`py-2 text-xs font-bold rounded-md transition-colors text-center ${
                  role === 'Administrator' 
                    ? 'bg-gray-900 text-white shadow-xs' 
                    : 'text-gray-600 hover:bg-gray-200/50'
                }`}
              >
                🛠️ Administrator
              </button>
              <button
                onClick={() => onChangeRole('Nutzer')}
                className={`py-2 text-xs font-bold rounded-md transition-colors text-center ${
                  role === 'Nutzer' 
                    ? 'bg-gray-900 text-white shadow-xs' 
                    : 'text-gray-600 hover:bg-gray-200/50'
                }`}
              >
                👤 Nutzer / Operator
              </button>
            </div>
            
            <p className="text-[10px] text-gray-400 text-center">
              Derzeit aktiv: <strong className="text-gray-700">{role}</strong>
            </p>
          </div>

          {/* API settings */}
          <div className="bg-white rounded-xl border border-gray-200/60 p-5 space-y-3 shadow-2xs">
            <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5 border-b border-gray-150 pb-2">
              <Key className="w-4 h-4 text-gray-400" />
              API Schlüssel & Schnittstelle
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Gültiges Bearer Token</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    disabled={role !== 'Administrator'}
                    value={apiTokenInput}
                    onChange={e => setApiTokenInput(e.target.value)}
                    className="flex-1 text-xs p-2 border border-gray-300 rounded font-mono disabled:bg-gray-50"
                  />
                  {role === 'Administrator' && (
                    <button
                      onClick={handleSaveToken}
                      className="bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs px-3.5 py-1.5 rounded"
                    >
                      Aktualisieren
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Seed/Reset Data */}
          {role === 'Administrator' && (
            <div className="bg-red-50/30 rounded-xl border border-red-200/60 p-5 space-y-3.5 shadow-2xs">
              <h3 className="font-semibold text-red-900 text-sm flex items-center gap-1.5 border-b border-red-200/60 pb-2">
                <RefreshCw className="w-4 h-4 text-red-500" />
                Gefahrenzone: System zurücksetzen
              </h3>
              <p className="text-[11px] text-red-700 leading-relaxed">
                Möchten Sie die gesamte Datenbank leeren und auf die ursprünglichen Demodaten zurücksetzen? 
                Alle selbst erstellten Verträge und Zahlungen werden gelöscht.
              </p>
              <button
                onClick={() => {
                  if (confirm('Datenbank wirklich vollständig zurücksetzen? Alle Änderungen gehen verloren.')) {
                    onResetDb();
                    alert('Datenbank erfolgreich zurückgesetzt.');
                  }
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 rounded transition-colors shadow-2xs"
              >
                Datenbank auf Werkseinstellungen zurücksetzen
              </button>
            </div>
          )}

        </div>

        {/* Custom Field Customizer */}
        <div className="space-y-6">
          
          {/* Custom Fields Settings */}
          <div className="bg-white rounded-xl border border-gray-200/60 p-5 space-y-4 shadow-2xs">
            <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5 border-b border-gray-150 pb-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              Datenstruktur-Erweiterung (Benutzerdefinierte Felder)
            </h3>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Erweitern Sie Objekte, Mieter und Verträge durch anpassbare benutzerdefinierte Felder. 
              Diese erscheinen direkt in den jeweiligen Eingabemasken.
            </p>

            {/* List of current custom fields */}
            <div className="space-y-2 max-h-[180px] overflow-y-auto">
              {db.customFields.map(cf => (
                <div key={cf.id} className="p-2.5 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="font-bold text-gray-900">{cf.name}</span>
                    <span className="ml-2 font-mono text-[9px] bg-gray-200/60 text-gray-600 px-1.5 py-0.2 rounded uppercase">
                      Typ: {cf.typ}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-medium flex items-center gap-0.5">
                      {cf.bereich === 'stellplatz' && <Building className="w-3 h-3" />}
                      {cf.bereich === 'mieter' && <Briefcase className="w-3 h-3" />}
                      {cf.bereich === 'vertrag' && <FileText className="w-3 h-3" />}
                      {cf.bereich}
                    </span>
                    {role === 'Administrator' && (
                      <button 
                        onClick={() => onDeleteCustomField(cf.id)}
                        className="text-red-500 hover:text-red-700 ml-1"
                        title="Feld löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {db.customFields.length === 0 && (
                <p className="text-xs text-gray-400 italic text-center py-4">Keine benutzerdefinierten Felder vorhanden.</p>
              )}
            </div>

            {/* Add Custom Field Form */}
            {role === 'Administrator' && (
              <form onSubmit={handleAddField} className="border-t border-gray-100 pt-4 space-y-3 text-xs bg-gray-50/50 p-3 rounded-lg">
                <div className="font-bold text-gray-700 text-[10px] uppercase">Neues Datenfeld hinzufügen</div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-gray-500">Feldname (Bezeichnung) *</label>
                    <input
                      type="text"
                      required
                      value={fieldName}
                      onChange={e => setFieldName(e.target.value)}
                      className="w-full text-xs p-2 border border-gray-300 rounded bg-white focus:outline-none"
                      placeholder="z.B. Stromzählerstand"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-gray-500">Daten-Typ *</label>
                    <select
                      value={fieldTyp}
                      onChange={e => setFieldTyp(e.target.value as any)}
                      className="w-full text-xs p-2 border border-gray-300 rounded bg-white focus:outline-none"
                    >
                      <option value="text">Freitext (String)</option>
                      <option value="number">Zahl (Dezimal)</option>
                      <option value="boolean">Ja / Nein (Auswahl)</option>
                      <option value="date">Datum (Kalender)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-gray-500">Einsatz-Bereich *</label>
                    <select
                      value={fieldBereich}
                      onChange={e => setFieldBereich(e.target.value as any)}
                      className="w-full text-xs p-2 border border-gray-300 rounded bg-white focus:outline-none"
                    >
                      <option value="stellplatz">Garagen / Stellplatz</option>
                      <option value="mieter">Mieterstammdaten</option>
                      <option value="vertrag">Mietvertrag</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-gray-500">Standardwert</label>
                    <input
                      type="text"
                      value={fieldStandard}
                      onChange={e => setFieldStandard(e.target.value)}
                      className="w-full text-xs p-2 border border-gray-300 rounded bg-white focus:outline-none"
                      placeholder="Zahl oder Text (optional)"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded transition-colors"
                >
                  Datenfeld registrieren
                </button>
              </form>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
