import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  FileCheck, 
  Calendar, 
  ShieldAlert, 
  Printer, 
  CheckCircle2, 
  PenTool, 
  Trash2, 
  Plus, 
  ArrowRight,
  Download,
  Info,
  Sparkles
} from 'lucide-react';
import { Vertrag, VertragStatus, DbSchema } from '../types';

interface VertraegeManagerProps {
  db: DbSchema;
  role: 'Administrator' | 'Nutzer';
  onAddVertrag: (item: Omit<Vertrag, 'id' | 'vertragsNummer' | 'erstelltAm' | 'dokumentUrl'>) => void;
  onEditVertrag: (id: string, item: Partial<Vertrag>) => void;
  onDeleteVertrag: (id: string) => void;
  onLogAudit: (action: string, details: string, section: any) => void;
}

export default function VertraegeManager({
  db,
  role,
  onAddVertrag,
  onEditVertrag,
  onDeleteVertrag,
  onLogAudit
}: VertraegeManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [showDocumentPreview, setShowDocumentPreview] = useState<string | null>(null);
  
  // Search
  const [search, setSearch] = useState('');

  // Form Fields
  const [mieterId, setMieterId] = useState('');
  const [stellplatzId, setStellplatzId] = useState('');
  const [startDatum, setStartDatum] = useState('2026-07-01');
  const [endDatum, setEndDatum] = useState('');
  const [kaution, setKaution] = useState(200);
  const [kautionBezahlt, setKautionBezahlt] = useState(false);
  const [kuendigungsfristMonate, setKuendigungsfristMonate] = useState(3);
  const [status, setStatus] = useState<VertragStatus>('Entwurf');
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  const contractCustomFields = useMemo(() => {
    return db.customFields.filter(cf => cf.bereich === 'vertrag');
  }, [db]);

  const filteredContracts = useMemo(() => {
    return db.vertraege.filter(v => {
      const mieter = db.mieter.find(m => m.id === v.mieterId);
      const stellplatz = db.stellplaetze.find(s => s.id === v.stellplatzId);
      
      const searchStr = `${v.vertragsNummer} ${mieter ? `${mieter.vorname} ${mieter.nachname}` : ''} ${stellplatz?.bezeichnung || ''}`.toLowerCase();
      return searchStr.includes(search.toLowerCase());
    });
  }, [db, search]);

  const openAddModal = () => {
    // Pick first available tenant and space
    const freeSpaces = db.stellplaetze.filter(s => s.status === 'Frei');
    setMieterId(db.mieter[0]?.id || '');
    setStellplatzId(freeSpaces[0]?.id || db.stellplaetze[0]?.id || '');
    setStartDatum(new Date().toISOString().split('T')[0]);
    setEndDatum('');
    setKaution(200);
    setKautionBezahlt(false);
    setKuendigungsfristMonate(3);
    setStatus('Entwurf');

    const initialCf: Record<string, string> = {};
    contractCustomFields.forEach(cf => {
      initialCf[cf.name] = cf.standardwert || '';
    });
    setCustomFieldValues(initialCf);

    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mieterId || !stellplatzId || !startDatum) return;

    onAddVertrag({
      mieterId,
      stellplatzId,
      startDatum,
      endDatum: endDatum || null,
      kaution: Number(kaution),
      kautionBezahlt,
      status,
      kuendigungsfristMonate: Number(kuendigungsfristMonate),
      customFields: customFieldValues
    });

    setShowModal(false);
  };

  const handleSignContract = (id: string, nr: string) => {
    if (confirm(`Möchten Sie den Vertrag "${nr}" jetzt offiziell digital gegenzeichnen? Der Status wechselt auf "Aktiv" und das Objekt wird reserviert.`)) {
      onEditVertrag(id, { status: 'Aktiv' });
      onLogAudit('Vertrag digital gezeichnet', `Vertrag ${nr} wurde vom Administrator digital gegengezeichnet.`, 'Verträge');
    }
  };

  const handleTerminateContract = (id: string, nr: string) => {
    if (confirm(`Sind Sie sicher, dass Sie den Vertrag "${nr}" beenden möchten? Der verknüpfte Stellplatz wird wieder als "Frei" freigegeben.`)) {
      onEditVertrag(id, { status: 'Beendet', endDatum: new Date().toISOString().split('T')[0] });
      onLogAudit('Vertrag beendet', `Vertrag ${nr} wurde beendet. Stellplatz freigegeben.`, 'Verträge');
    }
  };

  const handleDelete = (id: string, nr: string) => {
    if (confirm(`Sind Sie sicher, dass Sie den Vertrag "${nr}" unwiderruflich löschen möchten?`)) {
      onDeleteVertrag(id);
    }
  };

  // -------------------------------------------------------------
  // DYNAMIC GERMAN RENTAL CONTRACT TEMPLATE GENERATOR
  // -------------------------------------------------------------
  const previewedContractData = useMemo(() => {
    if (!showDocumentPreview) return null;
    const vt = db.vertraege.find(v => v.id === showDocumentPreview);
    if (!vt) return null;

    const mieter = db.mieter.find(m => m.id === vt.mieterId);
    const stellplatz = db.stellplaetze.find(s => s.id === vt.stellplatzId);
    const standort = stellplatz ? db.standorte.find(s => s.id === stellplatz.standortId) : null;

    return {
      vt,
      mieter,
      stellplatz,
      standort
    };
  }, [db, showDocumentPreview]);

  return (
    <div className="space-y-6" id="vertraege-section">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">
            Mietvertragssystem & Generierung ({filteredContracts.length})
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Erstellen, archivieren und unterzeichnen Sie Mietverträge für Garagen digital.
          </p>
        </div>
        {role === 'Administrator' && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 self-start sm:self-center bg-gray-900 hover:bg-gray-800 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Neuer Vertrag (Entwurf)</span>
          </button>
        )}
      </div>

      {/* Grid of contents: Main List or active contract preview document */}
      {showDocumentPreview && previewedContractData ? (
        // RENDER DIGITAL CONTRACT PREVIEW & DIGITAL LEASE DOCUMENT
        <div className="bg-white border border-gray-300 rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in duration-200">
          {/* Document Preview Action Header */}
          <div className="bg-gray-900 p-4 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              <div>
                <span className="font-bold text-sm">Dokumenten-Vorschau: {previewedContractData.vt.vertragsNummer}</span>
                <span className="ml-2 text-[10px] bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded font-mono uppercase">
                  Status: {previewedContractData.vt.status}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => window.print()}
                className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Drucken</span>
              </button>
              {previewedContractData.vt.status === 'Entwurf' && role === 'Administrator' && (
                <button
                  onClick={() => {
                    handleSignContract(previewedContractData.vt.id, previewedContractData.vt.vertragsNummer);
                    setShowDocumentPreview(null);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded flex items-center gap-1 font-semibold transition-colors"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Gegenzeichnen & Aktivieren</span>
                </button>
              )}
              <button
                onClick={() => setShowDocumentPreview(null)}
                className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded"
              >
                Schließen
              </button>
            </div>
          </div>

          {/* Legal German Lease Document Canvas */}
          <div className="p-8 max-w-2xl mx-auto space-y-8 bg-white text-gray-800 text-xs leading-relaxed font-sans border-x border-gray-100 my-4" id="printable-contract">
            {/* Header */}
            <div className="text-center space-y-1.5 border-b border-gray-200 pb-5">
              <h1 className="text-xl font-bold tracking-tight text-gray-900 uppercase">Garagen-Mietvertrag</h1>
              <p className="text-[10px] text-gray-400 font-mono">Vertragsnummer: {previewedContractData.vt.vertragsNummer}</p>
            </div>

            {/* Parties */}
            <div className="space-y-3">
              <h2 className="font-bold text-[11px] uppercase border-b border-gray-100 pb-1 text-gray-900">§ 1 Vertragsparteien</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 font-semibold uppercase text-[9px] tracking-wider">Vermieter:</p>
                  <p className="font-bold text-gray-900 mt-1">Sachsen Garagen GmbH & Co. KG</p>
                  <p className="text-gray-600">Leibnizstraße 14</p>
                  <p className="text-gray-600">04105 Leipzig</p>
                  <p className="text-[10px] text-gray-400 mt-1">Vertreten durch d. Administrator</p>
                </div>
                <div>
                  <p className="text-gray-400 font-semibold uppercase text-[9px] tracking-wider">Mieter:</p>
                  <p className="font-bold text-gray-900 mt-1">
                    {previewedContractData.mieter ? `${previewedContractData.mieter.vorname} ${previewedContractData.mieter.nachname}` : 'N/A'}
                  </p>
                  {previewedContractData.mieter?.firma && (
                    <p className="text-blue-800 font-semibold text-[10px]">{previewedContractData.mieter.firma}</p>
                  )}
                  <p className="text-gray-600">{previewedContractData.mieter?.adresse || 'N/A'}</p>
                  <p className="text-gray-600">{previewedContractData.mieter?.plz || ''} {previewedContractData.mieter?.ort || ''}</p>
                  <p className="text-[10px] text-gray-400 mt-1">E-Mail: {previewedContractData.mieter?.email || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Object of Agreement */}
            <div className="space-y-2">
              <h2 className="font-bold text-[11px] uppercase border-b border-gray-100 pb-1 text-gray-900">§ 2 Mietobjekt</h2>
              <p>
                Vermietet wird das folgende Mietobjekt in der Garagenanlage <strong>{previewedContractData.standort?.name || 'N/A'}</strong> (Lage: {previewedContractData.standort?.adresse || 'N/A'}, {previewedContractData.standort?.plz || ''} {previewedContractData.standort?.ort || ''}):
              </p>
              <div className="bg-gray-50 border border-gray-200/60 rounded-lg p-3 grid grid-cols-3 gap-2 font-mono text-[10px]">
                <div>
                  <span className="text-gray-400">Bezeichnung:</span>
                  <p className="font-bold text-gray-900">{previewedContractData.stellplatz?.bezeichnung || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Objekt-Typ:</span>
                  <p className="font-bold text-gray-900">{previewedContractData.stellplatz?.typ || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Abmessungen:</span>
                  <p className="font-bold text-gray-900">{previewedContractData.stellplatz?.groesse || 'N/A'}</p>
                </div>
              </div>
              <p className="text-gray-500 text-[10px] leading-relaxed">
                Das Mietobjekt darf ausschließlich zur Unterstellung von Kraftfahrzeugen, Fahrrädern und zulässigen Zubehörteilen genutzt werden. Eine Lagerung von feuergefährlichen Stoffen, Treibstoffen (außer im Fahrzeugtank) oder sonstigen Gefahrgütern ist strengstens untersagt.
              </p>
            </div>

            {/* Rent and Payment */}
            <div className="space-y-2">
              <h2 className="font-bold text-[11px] uppercase border-b border-gray-100 pb-1 text-gray-900">§ 3 Mietzins und Zahlungsweise</h2>
              <p>
                Der monatliche Mietzins beläuft sich auf <strong>{(previewedContractData.stellplatz?.mietpreis || 0).toFixed(2)} €</strong> (in Worten: {previewedContractData.stellplatz?.mietpreis === 95 ? 'fünfundneunzig' : previewedContractData.stellplatz?.mietpreis === 130 ? 'einhundertdreißig' : 'einhundert'} Euro). 
              </p>
              <p>
                Der Mietzins ist jeweils im Voraus, spätestens bis zum <strong>3. Werktag eines Kalendermonats</strong>, fällig. 
                Die Zahlung erfolgt vertragsgemäß bevorzugt über folgendes Lastschriftmandat des Mieters:
              </p>
              <p className="font-mono bg-gray-50 border border-gray-200 p-2 text-center rounded text-[10px] text-gray-700">
                Kontoverbindung IBAN: <strong>{previewedContractData.mieter?.iban || 'N/A'}</strong>
              </p>
            </div>

            {/* Lease duration */}
            <div className="space-y-2">
              <h2 className="font-bold text-[11px] uppercase border-b border-gray-100 pb-1 text-gray-900">§ 4 Mietdauer und Kündigungsfrist</h2>
              <p>
                Das Mietverhältnis beginnt am <strong>{new Date(previewedContractData.vt.startDatum).toLocaleDateString('de-DE')}</strong>. 
                {previewedContractData.vt.endDatum ? (
                  <span> Es ist befristet bis zum <strong>{new Date(previewedContractData.vt.endDatum).toLocaleDateString('de-DE')}</strong>.</span>
                ) : (
                  <span> Es wird auf unbestimmte Zeit geschlossen.</span>
                )}
              </p>
              <p>
                Die Kündigungsfrist beträgt beiderseits <strong>{previewedContractData.vt.kuendigungsfristMonate} Monate</strong> zum Monatsende. Die Kündigung bedarf der Schriftform.
              </p>
            </div>

            {/* Deposit (Kaution) */}
            <div className="space-y-2">
              <h2 className="font-bold text-[11px] uppercase border-b border-gray-100 pb-1 text-gray-900">§ 5 Mietkaution</h2>
              <p>
                Der Mieter hinterlegt beim Vermieter eine Kaution in Höhe von <strong>{previewedContractData.vt.kaution.toFixed(2)} €</strong>. 
                Die Kaution ist bei Schlüsselübergabe fällig.
              </p>
              <p className="flex items-center gap-1.5 font-semibold text-[10px]">
                Status Kaution: 
                {previewedContractData.vt.kautionBezahlt ? (
                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">Vollständig bezahlt und verbucht</span>
                ) : (
                  <span className="text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">Offen / Ausstehend</span>
                )}
              </p>
            </div>

            {/* Custom stipulations */}
            {Object.keys(previewedContractData.vt.customFields).length > 0 && (
              <div className="space-y-2 bg-amber-50/20 border border-amber-100 p-3.5 rounded-lg">
                <h3 className="font-bold text-[10px] text-amber-800 uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  § 6 Sondervereinbarungen (Benutzerdefinierte Felder)
                </h3>
                <div className="space-y-1 text-xs text-amber-900 font-medium">
                  {Object.entries(previewedContractData.vt.customFields).map(([key, val]) => (
                    <div key={key} className="flex gap-1.5">
                      <span className="text-amber-700">{key}:</span>
                      <span className="text-gray-800">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Signatures */}
            <div className="pt-10 grid grid-cols-2 gap-10">
              <div className="border-t border-gray-300 pt-3 text-center space-y-1">
                <p className="text-[10px] text-gray-400">Leipzig, {new Date(previewedContractData.vt.erstelltAm).toLocaleDateString('de-DE')}</p>
                <div className="h-10 flex items-center justify-center font-serif italic text-blue-600 font-bold text-xs">
                  Sachsen Garagen GmbH
                </div>
                <p className="font-bold text-gray-900 border-t border-gray-100 pt-1 text-[10px]">Vermieter</p>
              </div>

              <div className="border-t border-gray-300 pt-3 text-center space-y-1">
                <p className="text-[10px] text-gray-400">Leipzig, {new Date(previewedContractData.vt.erstelltAm).toLocaleDateString('de-DE')}</p>
                <div className="h-10 flex items-center justify-center">
                  {previewedContractData.vt.status !== 'Entwurf' ? (
                    <span className="font-serif italic text-emerald-600 font-bold text-xs">✓ digital gezeichnet</span>
                  ) : (
                    <span className="text-[10px] text-gray-400 italic">Unterschrift ausstehend</span>
                  )}
                </div>
                <p className="font-bold text-gray-900 border-t border-gray-100 pt-1 text-[10px]">
                  Mieter ({previewedContractData.mieter ? `${previewedContractData.mieter.vorname} ${previewedContractData.mieter.nachname}` : 'N/A'})
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // RENDER GENERAL CONTRACTS DASHBOARD TABLE
        <div className="space-y-4">
          {/* Search bar */}
          <div className="bg-white border border-gray-200/60 p-4 rounded-xl">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                placeholder="Suche nach Vertragsnummer, Mietername, Garagen-ID..."
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200/60 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-900 text-white font-semibold text-[10px] uppercase tracking-wider">
                    <th className="p-4">Vertrags-Nr</th>
                    <th className="p-4">Mietobjekt</th>
                    <th className="p-4">Mieter</th>
                    <th className="p-4">Zeitraum</th>
                    <th className="p-4">Kaution</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredContracts.map(vt => {
                    const mieter = db.mieter.find(m => m.id === vt.mieterId);
                    const sp = db.stellplaetze.find(s => s.id === vt.stellplatzId);
                    const loc = sp ? db.standorte.find(s => s.id === sp.standortId) : null;

                    return (
                      <tr key={vt.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-mono font-bold text-gray-900">
                          {vt.vertragsNummer}
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-gray-800">{sp?.bezeichnung || 'N/A'}</div>
                          <div className="text-[10px] text-gray-400">{loc?.name || 'N/A'}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-gray-800">
                            {mieter ? `${mieter.vorname} ${mieter.nachname}` : 'Gelöschter Mieter'}
                          </div>
                          {mieter?.firma && (
                            <div className="text-[10px] text-blue-700 font-medium">{mieter.firma}</div>
                          )}
                        </td>
                        <td className="p-4 text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span>{new Date(vt.startDatum).toLocaleDateString('de-DE')}</span>
                            <ArrowRight className="w-3 h-3 text-gray-400" />
                            <span>{vt.endDatum ? new Date(vt.endDatum).toLocaleDateString('de-DE') : 'Unbefristet'}</span>
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">Künd.-Frist: {vt.kuendigungsfristMonate} Monate</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-gray-900">{vt.kaution.toFixed(2)} €</div>
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-semibold border ${
                            vt.kautionBezahlt ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                          }`}>
                            {vt.kautionBezahlt ? 'Bezahlt' : 'Offen'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            vt.status === 'Aktiv' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            vt.status === 'Entwurf' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-gray-50 text-gray-500 border-gray-100'
                          }`}>
                            {vt.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-1 whitespace-nowrap">
                          {/* Sign/Activate Action */}
                          {vt.status === 'Entwurf' && role === 'Administrator' && (
                            <button
                              onClick={() => handleSignContract(vt.id, vt.vertragsNummer)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded"
                              title="Vertrag digital gegenzeichnen & aktivieren"
                            >
                              <PenTool className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Terminate Action */}
                          {vt.status === 'Aktiv' && role === 'Administrator' && (
                            <button
                              onClick={() => handleTerminateContract(vt.id, vt.vertragsNummer)}
                              className="p-1.5 text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded"
                              title="Vertrag kündigen / beenden"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Preview PDF/HTML */}
                          <button
                            onClick={() => setShowDocumentPreview(vt.id)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded"
                            title="Mietvertrag generieren & drucken"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          {role === 'Administrator' && (
                            <button
                              onClick={() => handleDelete(vt.id, vt.vertragsNummer)}
                              className="p-1.5 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded"
                              title="Eintrag löschen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredContracts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-gray-400 italic">
                        Keine Mietverträge gefunden.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-lg w-full overflow-hidden">
            <div className="bg-gray-900 p-4 text-white flex items-center justify-between">
              <h3 className="font-semibold text-sm">
                Neuen Mietvertrag entwerfen
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Mieter wählen *</label>
                  <select
                    required
                    value={mieterId}
                    onChange={e => setMieterId(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-900 bg-white"
                  >
                    <option value="" disabled>-- Bitte wählen --</option>
                    {db.mieter.map(m => (
                      <option key={m.id} value={m.id}>{m.vorname} {m.nachname} {m.firma ? `(${m.firma})` : ''}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Stellplatz wählen *</label>
                  <select
                    required
                    value={stellplatzId}
                    onChange={e => setStellplatzId(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-900 bg-white"
                  >
                    <option value="" disabled>-- Bitte wählen --</option>
                    {db.stellplaetze.map(sp => {
                      const loc = db.standorte.find(s => s.id === sp.standortId);
                      return (
                        <option key={sp.id} value={sp.id}>
                          {sp.bezeichnung} ({sp.status}) - {sp.mietpreis} €/M - {loc?.name.split(' ')[0]}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Mietbeginn *</label>
                  <input
                    type="date"
                    required
                    value={startDatum}
                    onChange={e => setStartDatum(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Befristung (Enddatum)</label>
                  <input
                    type="date"
                    value={endDatum}
                    onChange={e => setEndDatum(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                    placeholder="Unbefristet"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Mietkaution (€) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={kaution}
                    onChange={e => setKaution(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Kündigungsfrist (Monate) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={kuendigungsfristMonate}
                    onChange={e => setKuendigungsfristMonate(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 items-center pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="kautionBezahlt"
                    checked={kautionBezahlt}
                    onChange={e => setKautionBezahlt(e.target.checked)}
                    className="w-4 h-4 text-gray-900"
                  />
                  <label htmlFor="kautionBezahlt" className="text-xs font-semibold text-gray-700">
                    Kaution wurde bezahlt
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Status bei Anlage</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as VertragStatus)}
                    className="w-full text-xs p-2 border border-gray-300 rounded bg-white"
                  >
                    <option value="Entwurf">Entwurf (Unterschrift ausstehend)</option>
                    <option value="Aktiv">Aktiv (Direkt aktivieren)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Contract Custom Fields */}
              {contractCustomFields.length > 0 && (
                <div className="border-t border-gray-150 pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Benutzerdefinierte Vertragsdaten
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {contractCustomFields.map(cf => (
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
                            placeholder="Sonderregel eintragen..."
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
                  Entwurf speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
