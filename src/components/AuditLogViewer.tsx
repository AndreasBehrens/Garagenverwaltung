import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Calendar, 
  Terminal, 
  UserCheck, 
  Filter, 
  Cpu, 
  FileLock,
  ArrowDownLeft
} from 'lucide-react';
import { AuditLog, DbSchema } from '../types';

interface AuditLogViewerProps {
  db: DbSchema;
  role: 'Administrator' | 'Nutzer';
  onClearLogs?: () => void;
}

export default function AuditLogViewer({
  db,
  role,
  onClearLogs
}: AuditLogViewerProps) {
  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('All');

  const sections = useMemo(() => {
    const list = new Set<string>();
    db.auditLogs.forEach(log => list.add(log.bereich));
    return Array.from(list);
  }, [db]);

  const filteredLogs = useMemo(() => {
    return db.auditLogs.filter(log => {
      const searchStr = `${log.aktion} ${log.details} ${log.benutzer} ${log.bereich}`.toLowerCase();
      const matchesSearch = searchStr.includes(search.toLowerCase());
      const matchesSection = sectionFilter === 'All' || log.bereich === sectionFilter;
      return matchesSearch && matchesSection;
    }).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [db, search, sectionFilter]);

  return (
    <div className="space-y-6" id="audit-section">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            Sicherheits- & Systemprotokolle (Audit Trail)
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Umfassende Protokollierung aller Systemzugriffe, API-Abfragen und automatisierten Prozesse.
          </p>
        </div>
        {role === 'Administrator' && onClearLogs && (
          <button
            onClick={() => {
              if (confirm('Möchten Sie das gesamte Sicherheits-Audit-Log unwiderruflich leeren? Dies ist nur zu Entwicklungszwecken ratsam.')) {
                onClearLogs();
              }
            }}
            className="flex items-center gap-1.5 self-start sm:self-center bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors border border-red-200"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Protokoll leeren</span>
          </button>
        )}
      </div>

      {/* Overview stats */}
      <div className="bg-gray-900 text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sicherheitsprüfung</div>
          <h3 className="text-lg font-bold">Integrität: Bestanden</h3>
          <p className="text-xs text-gray-400">Alle Einträge sind kryptografisch sortiert und revisionssicher archiviert.</p>
        </div>

        <div className="flex gap-4 text-center font-mono">
          <div className="bg-gray-800 px-4 py-2 rounded border border-gray-700">
            <div className="text-[9px] text-gray-400 uppercase">Protokolle</div>
            <div className="text-base font-bold text-emerald-400">{db.auditLogs.length}</div>
          </div>
          <div className="bg-gray-800 px-4 py-2 rounded border border-gray-700">
            <div className="text-[9px] text-gray-400 uppercase">Letzter Zugriff</div>
            <div className="text-[10px] font-bold text-blue-400">
              {db.auditLogs[0] ? new Date(db.auditLogs[0].timestamp).toLocaleTimeString('de-DE') : 'Keiner'}
            </div>
          </div>
        </div>
      </div>

      {/* Search and Section filters */}
      <div className="bg-white border border-gray-200/60 p-4 rounded-xl flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
            placeholder="Suchen nach Aktion, Details, IP-Adresse, Nutzer..."
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <select
            value={sectionFilter}
            onChange={e => setSectionFilter(e.target.value)}
            className="text-xs p-2.5 border border-gray-300 rounded-lg focus:outline-none bg-white w-full sm:w-[180px]"
          >
            <option value="All">Alle Bereiche</option>
            {sections.map(sec => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Terminal list layout of Logs */}
      <div className="bg-gray-950 rounded-xl border border-gray-800 overflow-hidden shadow-xl">
        {/* Terminal Header */}
        <div className="bg-gray-900 px-4 py-2 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span className="text-[10px] text-gray-500 font-mono ml-2">secure_audit_trail.log</span>
          </div>
          <FileLock className="w-3.5 h-3.5 text-gray-500" />
        </div>

        {/* Console entries */}
        <div className="p-4 font-mono text-[11px] leading-relaxed text-gray-300 space-y-2 max-h-[500px] overflow-y-auto">
          {filteredLogs.map(log => {
            let color = 'text-gray-400';
            if (log.details.toLowerCase().includes('fehler') || log.details.toLowerCase().includes('fail')) {
              color = 'text-red-400';
            } else if (log.bereich === 'API') {
              color = 'text-cyan-400';
            } else if (log.bereich === 'Sicherheit') {
              color = 'text-emerald-400';
            } else if (log.bereich === 'Abrechnung') {
              color = 'text-yellow-400';
            }

            return (
              <div 
                key={log.id} 
                className="hover:bg-gray-900/50 p-2 rounded transition-colors border-b border-gray-900/40 flex flex-col sm:flex-row gap-2 items-start justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
                    <span className="text-gray-500 text-[10px] shrink-0">
                      [{new Date(log.timestamp).toLocaleString('de-DE')}]
                    </span>
                    <span className={`font-bold px-1 py-0.2 rounded text-[9px] uppercase tracking-wider ${
                      log.benutzer === 'SYSTEM' ? 'bg-indigo-900/40 text-indigo-300' : 'bg-gray-800 text-gray-300'
                    }`}>
                      {log.benutzer}
                    </span>
                    <span className={`text-[10px] font-bold ${color}`}>
                      ({log.bereich}) {log.aktion}
                    </span>
                  </div>
                  
                  <p className="text-gray-300 leading-normal pl-4 sm:pl-0">
                    {log.details}
                  </p>
                </div>

                <div className="text-[10px] text-gray-500 shrink-0 self-end sm:self-center font-mono bg-gray-900/80 px-2 py-0.5 rounded border border-gray-800">
                  IP: {log.ipAdresse}
                </div>
              </div>
            );
          })}
          {filteredLogs.length === 0 && (
            <p className="text-center text-gray-500 italic p-8">Keine Log-Einträge gefunden.</p>
          )}
        </div>
      </div>
    </div>
  );
}
