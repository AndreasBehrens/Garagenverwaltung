import React, { useMemo } from 'react';
import { 
  Building2, 
  Users, 
  CreditCard, 
  Wrench, 
  AlertTriangle, 
  Activity, 
  TrendingUp, 
  ArrowUpRight 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { DbSchema, AuditLog, Zahlung, Stellplatz } from '../types';

interface DashboardProps {
  db: DbSchema;
  role: 'Administrator' | 'Nutzer';
  setActiveTab: (tab: string) => void;
  triggerMonthlyRent: (monat: string) => void;
  triggerDunning: () => void;
  onSelectSpace?: (spaceId: string) => void;
}

export default function Dashboard({ 
  db, 
  role, 
  setActiveTab, 
  triggerMonthlyRent, 
  triggerDunning,
  onSelectSpace 
}: DashboardProps) {

  // Current Date Context (July 2026 as per local metadata)
  const currentMonth = '2026-07';

  // 1. Key Metrics Calculations
  const metrics = useMemo(() => {
    const totalSpaces = db.stellplaetze.length;
    const rentedSpaces = db.stellplaetze.filter(s => s.status === 'Vermietet').length;
    const maintenanceSpaces = db.stellplaetze.filter(s => s.status === 'Wartung').length;
    const freeSpaces = totalSpaces - rentedSpaces - maintenanceSpaces;
    
    const occupancyRate = totalSpaces > 0 ? Math.round((rentedSpaces / totalSpaces) * 100) : 0;

    // Financial calculations
    const currentMonthPayments = db.zahlungen.filter(z => z.monat === currentMonth);
    const expectedRevenue = currentMonthPayments.reduce((sum, z) => sum + z.betrag, 0);
    const actualRevenue = currentMonthPayments
      .filter(z => z.status === 'Bezahlt')
      .reduce((sum, z) => sum + z.betrag, 0);
    
    // Total open invoices across all months
    const totalOpenPayments = db.zahlungen
      .filter(z => z.status !== 'Bezahlt')
      .reduce((sum, z) => sum + z.betrag, 0);

    const openInvoicesCount = db.zahlungen.filter(z => z.status !== 'Bezahlt').length;

    // Maintenance pending
    const maintenancePendingCount = db.wartungen.filter(w => w.status === 'Geplanter Termin').length;

    return {
      totalSpaces,
      rentedSpaces,
      freeSpaces,
      occupancyRate,
      expectedRevenue,
      actualRevenue,
      totalOpenPayments,
      openInvoicesCount,
      maintenancePendingCount,
      totalTenants: db.mieter.filter(m => m.status === 'Aktiv').length
    };
  }, [db, currentMonth]);

  // 2. Location-wise occupancy data
  const locationChartData = useMemo(() => {
    return db.standorte.map(st => {
      const spaces = db.stellplaetze.filter(s => s.standortId === st.id);
      const total = spaces.length;
      const rented = spaces.filter(s => s.status === 'Vermietet').length;
      const rate = total > 0 ? Math.round((rented / total) * 100) : 0;
      
      return {
        name: st.name.replace(/\(.*\)/, '').trim(), // clean up names for chart
        'Auslastung (%)': rate,
        'Stellplätze Gesamt': total,
        'Vermietet': rented
      };
    });
  }, [db]);

  // 3. Payment Status Chart Data
  const paymentStatusData = useMemo(() => {
    const currentPayments = db.zahlungen.filter(z => z.monat === currentMonth);
    const paid = currentPayments.filter(z => z.status === 'Bezahlt').length;
    const open = currentPayments.filter(z => z.status === 'Offen').length;
    const overdue = currentPayments.filter(z => z.status === 'Overdue' || z.status === 'Gemahnt').length;

    return [
      { name: 'Bezahlt', value: paid, color: '#10B981' },
      { name: 'Offen', value: open, color: '#3B82F6' },
      { name: 'Überfällig', value: overdue, color: '#EF4444' }
    ].filter(item => item.value > 0);
  }, [db, currentMonth]);

  // 4. Critical Alerts (Wartungen / Mahnungen)
  const criticalAlerts = useMemo(() => {
    const alerts: { id: string; type: 'warning' | 'error' | 'info'; title: string; desc: string; actionText?: string; tab?: string; payload?: any }[] = [];

    // Check for overdue or dunned payments
    const overdueInvoices = db.zahlungen.filter(z => z.status === 'Overdue' || z.status === 'Gemahnt');
    if (overdueInvoices.length > 0) {
      alerts.push({
        id: 'alt-payment',
        type: 'error',
        title: `${overdueInvoices.length} säumige Zahlung(en) erfordern Mahnung`,
        desc: `Insgesamt stehen noch ${overdueInvoices.reduce((s, z) => s + z.betrag, 0).toFixed(2)} € an Mietzahlungen aus.`,
        actionText: 'Mahnwesen starten',
        tab: 'finanzen'
      });
    }

    // Check for pending maintenance
    const pendingWartungen = db.wartungen.filter(w => w.status === 'Geplanter Termin');
    pendingWartungen.forEach(w => {
      const sp = db.stellplaetze.find(s => s.id === w.stellplatzId);
      alerts.push({
        id: `alt-w-${w.id}`,
        type: 'warning',
        title: `Wartung fällig: ${w.titel}`,
        desc: `Geplant für ${sp?.bezeichnung || 'Stellplatz'} am ${new Date(w.datum).toLocaleDateString('de-DE')}.`,
        actionText: 'Wartung anzeigen',
        tab: 'wartung'
      });
    });

    // Suggest generating invoices for current month if empty
    const currentMonthInvoices = db.zahlungen.filter(z => z.monat === currentMonth);
    if (currentMonthInvoices.length === 0) {
      alerts.push({
        id: 'alt-invoice-generation',
        type: 'info',
        title: `Mietabrechnung für ${currentMonth} ausstehend`,
        desc: 'Es wurden noch keine Rechnungen für den aktuellen Abrechnungszeitraum erstellt.',
        actionText: 'Mietabrechnung erstellen',
        tab: 'finanzen'
      });
    }

    return alerts;
  }, [db, currentMonth]);

  return (
    <div className="space-y-6" id="dashboard-section">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900" id="welcome-header">
            Willkommen im Verwaltungs-Dashboard
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Übersicht aller Stellplätze, Mieter, Verträge und Automatisierungen für {currentMonth}.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center bg-gray-50 border border-gray-200/80 rounded-lg p-1.5 text-xs font-mono text-gray-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Rolle: <strong className="text-gray-900">{role}</strong>
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-start justify-between" id="metric-occupancy">
          <div className="space-y-2 flex-1">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Gesamtauslastung</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-slate-900">{metrics.occupancyRate}%</span>
              <span className="text-[10px] font-mono text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                +{metrics.rentedSpaces} vermietet
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${metrics.occupancyRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-start justify-between" id="metric-tenants">
          <div className="space-y-2 flex-1">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Aktive Verträge</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-slate-900">{metrics.totalTenants}</span>
              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Digital (E-Sign)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 font-medium">94% Abschlussquote via Mail</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-start justify-between" id="metric-finances">
          <div className="space-y-2 flex-1">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Offene Zahlungen</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-slate-900 font-mono">{metrics.totalOpenPayments.toLocaleString('de-DE')} €</span>
              <span className="text-[10px] font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                {metrics.openInvoicesCount} Belege
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 italic">Automatisiertes Mahnwesen aktiv</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-start justify-between" id="metric-maintenance">
          <div className="space-y-2 flex-1">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Wartungsintervalle</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-slate-900 font-mono">{metrics.maintenancePendingCount}</span>
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                {db.stellplaetze.filter(s => s.status === 'Wartung').length} gesperrt
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-3">Prüfung für Standorte ausstehend</p>
          </div>
        </div>
      </div>

      {/* Critical Alerts / Tasks Panel */}
      {criticalAlerts.length > 0 && (
        <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-5 space-y-3" id="critical-alerts-panel">
          <div className="flex items-center gap-2 text-rose-800 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Aktionserforderliche Hinweise ({criticalAlerts.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {criticalAlerts.map(alert => (
              <div 
                key={alert.id} 
                className="bg-white p-3.5 rounded-lg border border-rose-100 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
              >
                <div>
                  <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${alert.type === 'error' ? 'bg-red-500' : alert.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
                    {alert.title}
                  </div>
                  <p className="text-gray-500 mt-1 leading-relaxed">{alert.desc}</p>
                </div>
                {alert.actionText && (
                  <button
                    onClick={() => {
                      if (alert.tab) {
                        setActiveTab(alert.tab);
                        if (alert.tab === 'finanzen' && alert.id === 'alt-payment') {
                          // Focus finance tab
                        }
                      }
                    }}
                    className="shrink-0 flex items-center gap-1 bg-gray-900 hover:bg-gray-800 text-white font-medium px-3 py-1.5 rounded-md transition-colors"
                  >
                    <span>{alert.actionText}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts & Graphs Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Occupancy Rates by Location */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-blue-600 rounded-sm"></span>
              Auslastung nach Standorten (%)
            </h3>
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider font-semibold">Live-Status</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={locationChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', fontSize: '12px', border: 'none' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Bar dataKey="Auslastung (%)" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={40}>
                  {locationChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 2 ? '#3b82f6' : '#2563eb'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Payment Status Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-slate-800 flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-blue-600 rounded-sm"></span>
              Zahlungsstatus {currentMonth}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Stand der Belege im Abrechnungszeitraum</p>
          </div>
          
          <div className="h-44 w-full flex items-center justify-center relative">
            {paymentStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {paymentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400 italic">Keine Rechnungen generiert</div>
            )}
            <div className="absolute flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Gesamt</span>
              <span className="text-lg font-extrabold text-slate-800">
                {db.zahlungen.filter(z => z.monat === currentMonth).length} Belege
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            {paymentStatusData.map((item, idx) => {
              const count = item.value;
              const total = db.zahlungen.filter(z => z.monat === currentMonth).length;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={idx} className="flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">{count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two-Column Bottom Layout: Recent Access Logs & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Audit Access Logs (Protokollierung aller Systemzugriffe) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-blue-600 rounded-sm"></span>
              Sicherheitsprüfprotokoll (Zugriffe)
            </h3>
            <button 
              onClick={() => setActiveTab('audit')} 
              className="text-xs text-blue-600 hover:underline font-bold"
            >
              Alle Logs
            </button>
          </div>
          <div className="flow-root">
            <ul className="-mb-8">
              {db.auditLogs.slice(0, 4).map((log, logIdx) => (
                <li key={log.id}>
                  <div className="relative pb-8">
                    {logIdx !== 3 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-100" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                          log.bereich === 'Sicherheit' ? 'bg-rose-50 text-rose-600' :
                          log.bereich === 'API' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-600'
                        }`}>
                          {log.bereich === 'Sicherheit' ? <AlertTriangle className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5">
                        <div className="flex justify-between items-start gap-4">
                          <p className="text-xs font-semibold text-slate-900">{log.aktion}</p>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleTimeString('de-DE')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{log.details}</p>
                        <div className="flex items-center gap-2 mt-1 font-mono text-[9px] text-slate-400">
                          <span>User: {log.benutzer}</span>
                          <span>•</span>
                          <span>IP: {log.ipAdresse}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Quick-Actions / Status summary */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-blue-600 rounded-sm"></span>
              Garagenbelegung Quick-List
            </h3>
            <button 
              onClick={() => setActiveTab('stellplaetze')} 
              className="text-xs text-blue-600 hover:underline font-bold"
            >
              Alle Garagen
            </button>
          </div>
          
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {db.stellplaetze.map(sp => {
              const location = db.standorte.find(s => s.id === sp.standortId);
              const activeVertrag = db.vertraege.find(v => v.stellplatzId === sp.id && v.status === 'Aktiv');
              const mieter = activeVertrag ? db.mieter.find(m => m.id === activeVertrag.mieterId) : null;

              return (
                <div 
                  key={sp.id} 
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 text-xs transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      {sp.bezeichnung}
                      <span className="text-[10px] font-normal text-slate-400">({location?.name.split(' ')[0]})</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {sp.typ} • {sp.mietpreis} €/Monat {sp.stromanschluss && '• Strom ⚡'}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {mieter && (
                      <span className="text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 border border-slate-200/50 rounded">
                        {mieter.vorname[0]}. {mieter.nachname}
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${
                      sp.status === 'Frei' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      sp.status === 'Vermietet' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {sp.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
