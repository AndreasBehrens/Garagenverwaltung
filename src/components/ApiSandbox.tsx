import React, { useState } from 'react';
import { 
  Terminal, 
  Key, 
  Send, 
  Copy, 
  Check, 
  Cpu, 
  Code, 
  RefreshCw, 
  Database,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { DbSchema } from '../types';

interface ApiSandboxProps {
  db: DbSchema;
  role: 'Administrator' | 'Nutzer';
}

export default function ApiSandbox({
  db,
  role
}: ApiSandboxProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/api/v1/accounting/payments');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const apiToken = db.settings.apiToken;

  const handleCopyToken = () => {
    navigator.clipboard.writeText(apiToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const executeApiCall = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(selectedEndpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setApiResponse(data);
    } catch (e) {
      setApiResponse({ error: 'Verbindung zur API fehlgeschlagen.', details: String(e) });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6" id="api-section">
      {/* Header */}
      <div className="border-b border-gray-100 pb-5">
        <h2 className="text-xl font-semibold tracking-tight text-gray-900">
          Buchhaltungs- & API-Schnittstelle (Sandbox)
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Integrieren Sie externe Buchhaltungssysteme wie DATEV, Lexoffice oder SevDesk über unsere REST-API.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* API Credentials and Endpoints */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Credentials Card */}
          <div className="bg-white rounded-xl border border-gray-200/60 p-5 space-y-4 shadow-2xs">
            <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5 border-b border-gray-150 pb-2">
              <Key className="w-4 h-4 text-gray-400" />
              API-Authentifizierung
            </h3>

            <p className="text-[11px] text-gray-500 leading-relaxed">
              Jede Anfrage an die Buchhaltungs-Schnittstelle erfordert ein Bearer Token im HTTP-Header:
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1.5">
              <div className="text-[9px] font-mono text-gray-400 uppercase">Authorization Header</div>
              <div className="flex items-center justify-between gap-2 font-mono text-[10px] text-gray-700 bg-white border border-gray-200/60 px-2 py-1.5 rounded">
                <span className="truncate max-w-[160px]">Bearer {apiToken}</span>
                <button 
                  onClick={handleCopyToken}
                  className="text-gray-400 hover:text-gray-900 shrink-0"
                  title="Token kopieren"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="bg-amber-50 text-amber-800 text-[10px] p-3 rounded-lg border border-amber-100/80 leading-relaxed">
              <strong>Sicherheitshinweis:</strong> Geben Sie diesen Token niemals an unbefugte Dritte weiter. Er gewährt vollen Lesezugriff auf Finanzströme.
            </div>
          </div>

          {/* Endpoint selector */}
          <div className="bg-white rounded-xl border border-gray-200/60 p-5 space-y-3 shadow-2xs">
            <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5 border-b border-gray-150 pb-2">
              <Code className="w-4 h-4 text-gray-400" />
              Schnittstellen / Endpunkte
            </h3>

            <div className="space-y-2">
              {[
                { path: '/api/v1/accounting/payments', name: 'Zahlungs-Journal', desc: 'Liefert alle getätigten Mieteinnahmen.' },
                { path: '/api/v1/accounting/unpaid', name: 'Offene Posten', desc: 'Liefert unbezahlte, fällige Posten.' },
                { path: '/api/v1/accounting/contracts', name: 'Vertragsspiegel', desc: 'Liefert alle aktiven Mietverträge.' }
              ].map(ep => (
                <div 
                  key={ep.path}
                  onClick={() => setSelectedEndpoint(ep.path)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-colors ${
                    selectedEndpoint === ep.path 
                      ? 'bg-gray-900 text-white border-gray-900' 
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold">{ep.name}</span>
                    <span className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded ${
                      selectedEndpoint === ep.path ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      GET
                    </span>
                  </div>
                  <code className={`block text-[10px] font-mono mt-1 ${
                    selectedEndpoint === ep.path ? 'text-emerald-300' : 'text-gray-400'
                  }`}>
                    {ep.path}
                  </code>
                  <p className={`text-[10px] mt-1.5 leading-snug ${
                    selectedEndpoint === ep.path ? 'text-gray-300' : 'text-gray-400'
                  }`}>
                    {ep.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Live Playground sandbox */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200/60 p-5 space-y-4 shadow-2xs flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5 border-b border-gray-150 pb-2">
              <Terminal className="w-4 h-4 text-emerald-600" />
              API Sandbox & Live Abfrage
            </h3>

            {/* Simulated Request header */}
            <div className="bg-gray-900/5 p-4 rounded-xl space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-600">Simulierte Anfrage</span>
                <span className="text-gray-400 font-mono text-[10px]">CURL / HTTP</span>
              </div>
              <div className="font-mono text-[10px] text-gray-300 bg-gray-950 p-3 rounded-lg leading-relaxed overflow-x-auto space-y-1">
                <div><span className="text-pink-400">curl</span> -X GET \</div>
                <div>  -H <span className="text-emerald-400">"Authorization: Bearer {apiToken.slice(0, 10)}..."</span> \</div>
                <div>  "{window.location.origin}{selectedEndpoint}"</div>
              </div>
            </div>

            {/* Execute trigger */}
            <button
              onClick={executeApiCall}
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Lade Daten...' : 'Live-Anfrage absenden'}</span>
            </button>
          </div>

          {/* Response Output Inspector */}
          <div className="space-y-2 mt-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-600">Server-Antwort (JSON Payload)</span>
              {apiResponse && (
                <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Status: 200 OK
                </span>
              )}
            </div>

            <div className="bg-gray-950 rounded-lg p-4 font-mono text-[10px] leading-relaxed text-gray-300 overflow-auto flex-1 min-h-[220px] max-h-[300px]">
              {apiResponse ? (
                <pre className="whitespace-pre">{JSON.stringify(apiResponse, null, 2)}</pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 italic">
                  <Database className="w-8 h-8 text-gray-700 mb-2 animate-pulse" />
                  Klicken Sie auf "Live-Anfrage absenden", um die REST-API Schnittstelle in Echtzeit zu testen.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
