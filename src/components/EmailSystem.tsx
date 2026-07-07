import React, { useState, useMemo } from 'react';
import { 
  Mail, 
  Send, 
  Settings2, 
  Search, 
  Check, 
  AlertTriangle, 
  Sparkles, 
  Inbox, 
  ChevronRight,
  Eye,
  RefreshCw,
  BellRing
} from 'lucide-react';
import { Notification, DbSchema } from '../types';

interface EmailSystemProps {
  db: DbSchema;
  role: 'Administrator' | 'Nutzer';
  onEditEmailTemplate: (type: 'invoice' | 'dunning' | 'maintenance', template: string) => void;
  onSendTestEmail: (mieterId: string, subject: string, body: string) => Promise<any>;
}

export default function EmailSystem({
  db,
  role,
  onEditEmailTemplate,
  onSendTestEmail
}: EmailSystemProps) {
  const [search, setSearch] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<Notification | null>(null);
  
  // Template editing fields
  const [editingTemplateType, setEditingTemplateType] = useState<'invoice' | 'dunning' | 'maintenance'>('invoice');
  const [templateContent, setTemplateContent] = useState('');

  // Test Email states
  const [testMieterId, setTestMieterId] = useState('');
  const [testSubject, setTestSubject] = useState('Sachsen Garagen - Freundliche Zahlungserinnerung');
  const [testBody, setTestBody] = useState('Sehr geehrte Damen und Herren,\n\ndies ist eine freundliche Zahlungserinnerung für Ihre Garage. Bitte überweisen Sie den offenen Betrag.\n\nMit freundlichen Grüßen,\nSachsen Garagen GmbH');
  const [isSending, setIsSending] = useState(false);

  // Initialize template content upon clicking a template type
  React.useEffect(() => {
    if (editingTemplateType === 'invoice') {
      setTemplateContent(db.settings.emailTemplateRechnung);
    } else if (editingTemplateType === 'dunning') {
      setTemplateContent(db.settings.emailTemplateMahnung);
    } else if (editingTemplateType === 'maintenance') {
      setTemplateContent(db.settings.emailTemplateWartung);
    }
  }, [editingTemplateType, db.settings]);

  const filteredEmails = useMemo(() => {
    return db.notifications.filter(e => {
      const searchStr = `${e.empfaenger} ${e.betreff} ${e.status}`.toLowerCase();
      return searchStr.includes(search.toLowerCase());
    }).sort((a,b) => new Date(b.gesendetAm).getTime() - new Date(a.gesendetAm).getTime());
  }, [db, search]);

  const handleSaveTemplate = () => {
    onEditEmailTemplate(editingTemplateType, templateContent);
    alert('Die E-Mail-Vorlage wurde erfolgreich gespeichert und für zukünftige automatisierte Benachrichtigungen hinterlegt.');
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testMieterId || !testSubject || !testBody) return;

    setIsSending(true);
    try {
      await onSendTestEmail(testMieterId, testSubject, testBody);
      alert('Test-E-Mail wurde erfolgreich generiert und im Postausgang (Protokoll) archiviert.');
      setTestSubject('Sachsen Garagen - Freundliche Zahlungserinnerung');
      setTestBody('');
    } catch (err) {
      alert('Senden fehlgeschlagen.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6" id="email-section">
      {/* Header */}
      <div className="border-b border-gray-100 pb-5">
        <h2 className="text-xl font-semibold tracking-tight text-gray-900">
          Benachrichtigungssystem & E-Mail-Protokoll
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Automatisierte Zahlungserinnerungen, Mahnschreiben und Wartungsankündigungen per Mail.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Outbox Log */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200/60 p-5 space-y-4 shadow-2xs flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5 border-b border-gray-150 pb-2">
              <Inbox className="w-4 h-4 text-gray-400" />
              Gesendete Nachrichten / Postausgang ({filteredEmails.length})
            </h3>

            {/* Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full text-[11px] pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none"
                placeholder="Suche in gesendeten Mails..."
              />
            </div>

            {/* Email list */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {filteredEmails.map(mail => (
                <div 
                  key={mail.id}
                  onClick={() => setSelectedEmail(mail)}
                  className={`p-3 rounded-lg border text-[11px] flex justify-between items-center cursor-pointer transition-colors ${
                    selectedEmail?.id === mail.id 
                      ? 'border-gray-900 bg-gray-50' 
                      : 'border-gray-200 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="space-y-1 truncate flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-gray-900 truncate">{mail.empfaenger}</span>
                      <span className="text-[9px] text-gray-400 font-mono">
                        {new Date(mail.gesendetAm).toLocaleString('de-DE')}
                      </span>
                    </div>
                    <p className="text-gray-600 font-medium truncate">{mail.betreff}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wider ${
                      mail.status === 'Gesendet' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-red-50 text-red-700 border-red-100'
                    }`}>
                      {mail.status}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                </div>
              ))}
              {filteredEmails.length === 0 && (
                <p className="text-xs text-gray-400 italic text-center p-8">Keine versendeten Benachrichtigungen protokolliert.</p>
              )}
            </div>
          </div>

          {/* Detailed Selected Email Inspector */}
          {selectedEmail && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="flex justify-between items-start border-b border-gray-200 pb-2">
                <div>
                  <h4 className="font-bold text-gray-900 text-xs">E-Mail Detailansicht</h4>
                  <p className="text-[10px] text-gray-500 font-mono">Gesendet am: {new Date(selectedEmail.gesendetAm).toLocaleString('de-DE')}</p>
                </div>
                <button 
                  onClick={() => setSelectedEmail(null)}
                  className="text-gray-400 hover:text-gray-900 font-bold text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="text-[10px] space-y-1">
                <div><span className="text-gray-400 font-semibold uppercase">An:</span> <strong className="text-gray-800">{selectedEmail.empfaenger}</strong></div>
                <div><span className="text-gray-400 font-semibold uppercase">Betreff:</span> <strong className="text-gray-800">{selectedEmail.betreff}</strong></div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-3 max-h-[160px] overflow-y-auto whitespace-pre-wrap font-sans text-[11px] text-gray-700">
                {selectedEmail.nachricht}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Notification Settings and Template Customizer */}
        <div className="space-y-6">
          {/* Templates customizer card */}
          <div className="bg-white rounded-xl border border-gray-200/60 p-5 space-y-4 shadow-2xs">
            <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5 border-b border-gray-150 pb-2">
              <Settings2 className="w-4 h-4 text-gray-400" />
              E-Mail Vorlagen anpassen
            </h3>

            {/* Selector */}
            <div className="flex gap-1 border-b border-gray-100 pb-2">
              {(['invoice', 'dunning', 'maintenance'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setEditingTemplateType(type)}
                  className={`flex-1 text-[10px] font-bold py-1 px-1.5 rounded text-center transition-colors ${
                    editingTemplateType === type 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type === 'invoice' ? 'Abrechnung' : type === 'dunning' ? 'Mahnung' : 'Wartung'}
                </button>
              ))}
            </div>

            {/* Template input box */}
            <div className="space-y-2">
              <div className="text-[9px] text-gray-400 font-semibold uppercase flex items-center justify-between">
                <span>Inhalts-Vorlage</span>
                <span className="text-blue-600">Verfügbare Variablen: {"{mieter}"}, {"{betrag}"}, {"{objekt}"}</span>
              </div>
              <textarea
                value={templateContent}
                onChange={e => setTemplateContent(e.target.value)}
                rows={7}
                disabled={role !== 'Administrator'}
                className="w-full text-xs p-2.5 border border-gray-300 rounded font-mono focus:outline-none focus:border-gray-900 leading-relaxed disabled:bg-gray-50"
              />
              {role === 'Administrator' ? (
                <button
                  onClick={handleSaveTemplate}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs py-2 rounded transition-colors"
                >
                  Vorlage speichern
                </button>
              ) : (
                <p className="text-[9px] text-gray-400 text-center italic">Nur Administratoren können globale E-Mail-Vorlagen ändern.</p>
              )}
            </div>
          </div>

          {/* Test Dispatch module */}
          {role === 'Administrator' && (
            <div className="bg-white rounded-xl border border-gray-200/60 p-5 space-y-4 shadow-2xs">
              <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5 border-b border-gray-150 pb-2">
                <BellRing className="w-4 h-4 text-blue-500 animate-bounce" />
                Manuelle Mail versenden
              </h3>

              <form onSubmit={handleSendTest} className="space-y-3 text-[11px]">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-600">Empfänger wählen *</label>
                  <select
                    required
                    value={testMieterId}
                    onChange={e => setTestMieterId(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-300 rounded bg-white"
                  >
                    <option value="" disabled>-- Mieter wählen --</option>
                    {db.mieter.map(m => (
                      <option key={m.id} value={m.id}>{m.vorname} {m.nachname} ({m.email})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-600">Betreff *</label>
                  <input
                    type="text"
                    required
                    value={testSubject}
                    onChange={e => setTestSubject(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-300 rounded"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-600">Inhalt *</label>
                  <textarea
                    required
                    value={testBody}
                    onChange={e => setTestBody(e.target.value)}
                    rows={4}
                    className="w-full text-xs p-2 border border-gray-300 rounded"
                    placeholder="E-Mail Nachrichtentext hier eintragen..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 rounded transition-colors flex items-center justify-center gap-1.5 disabled:bg-blue-300"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Sende...' : 'E-Mail jetzt absenden'}</span>
                </button>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
