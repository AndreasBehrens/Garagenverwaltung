import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Building2, 
  Warehouse, 
  Users2, 
  FileSignature, 
  Coins, 
  Wrench, 
  Mail, 
  ShieldCheck, 
  Terminal, 
  Settings2,
  Lock,
  Menu,
  X,
  RefreshCw,
  Bell,
  Cpu
} from 'lucide-react';

import { DbSchema, Standort, Stellplatz, Mieter, Vertrag, Zahlung, WartungsEintrag, CustomFieldDefinition } from './types';

// Importing UI Sub-managers
import Dashboard from './components/Dashboard';
import StandorteManager from './components/StandorteManager';
import StellplaetzeManager from './components/StellplaetzeManager';
import MieterManager from './components/MieterManager';
import VertraegeManager from './components/VertraegeManager';
import FinanzenManager from './components/FinanzenManager';
import WartungManager from './components/WartungManager';
import EmailSystem from './components/EmailSystem';
import AuditLogViewer from './components/AuditLogViewer';
import ApiSandbox from './components/ApiSandbox';
import SettingsManager from './components/SettingsManager';

export default function App() {
  const [db, setDb] = useState<DbSchema | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [role, setRole] = useState<'Administrator' | 'Nutzer'>('Administrator');
  const [selectedStandortFilter, setSelectedStandortFilter] = useState<string>('All');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load database from API
  const loadData = async () => {
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      if (data.success) {
        setDb(data.db);
      }
    } catch (e) {
      console.error('Error fetching data from API:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // API call helpers
  const handleAddStandort = async (item: Omit<Standort, 'id'>) => {
    try {
      const res = await fetch('/api/standorte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item, role })
      });
      const data = await res.json();
      if (data.success) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditStandort = async (id: string, item: Partial<Standort>) => {
    try {
      const res = await fetch(`/api/standorte/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item, role })
      });
      const data = await res.json();
      if (data.success) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteStandort = async (id: string) => {
    try {
      const res = await fetch(`/api/standorte/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (data.success) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Stellplätze
  const handleAddStellplatz = async (item: Omit<Stellplatz, 'id'>) => {
    try {
      const res = await fetch('/api/stellplaetze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item, role })
      });
      const data = await res.json();
      if (data.success) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditStellplatz = async (id: string, item: Partial<Stellplatz>) => {
    try {
      const res = await fetch(`/api/stellplaetze/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item, role })
      });
      const data = await res.json();
      if (data.success) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteStellplatz = async (id: string) => {
    try {
      const res = await fetch(`/api/stellplaetze/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (data.success) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Mieter
  const handleAddMieter = async (item: Omit<Mieter, 'id'>) => {
    try {
      const res = await fetch('/api/mieter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item, role })
      });
      const data = await res.json();
      if (data.success) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditMieter = async (id: string, item: Partial<Mieter>) => {
    try {
      const res = await fetch(`/api/mieter/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item, role })
      });
      const data = await res.json();
      if (data.success) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMieter = async (id: string) => {
    try {
      const res = await fetch(`/api/mieter/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (data.success) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Verträge
  const handleAddVertrag = async (item: Omit<Vertrag, 'id' | 'vertragsNummer' | 'erstelltAm' | 'dokumentUrl'>) => {
    try {
      const res = await fetch('/api/vertraege', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item, role })
      });
      const data = await res.json();
      if (data.success) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditVertrag = async (id: string, item: Partial<Vertrag>) => {
    try {
      const res = await fetch(`/api/vertraege/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item, role })
      });
      const data = await res.json();
      if (data.success) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteVertrag = async (id: string) => {
    try {
      const res = await fetch(`/api/vertraege/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (data.success) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Zahlungen
  const handleAddZahlung = async (item: Omit<Zahlung, 'id'>) => {
    try {
      const res = await fetch('/api/zahlungen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item, role })
      });
      const data = await res.json();
      if (data.success) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditZahlung = async (id: string, item: Partial<Zahlung>) => {
    try {
      const res = await fetch(`/api/zahlungen/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item, role })
      });
      const data = await res.json();
      if (data.success) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteZahlung = async (id: string) => {
    try {
      const res = await fetch(`/api/zahlungen/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (data.success) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Wartung
  const handleAddWartung = async (item: Omit<WartungsEintrag, 'id'>) => {
    try {
      const res = await fetch('/api/wartungen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item, role })
      });
      const data = await res.json();
      if (data.success) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditWartung = async (id: string, item: Partial<WartungsEintrag>) => {
    try {
      const res = await fetch(`/api/wartungen/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item, role })
      });
      const data = await res.json();
      if (data.success) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteWartung = async (id: string) => {
    try {
      const res = await fetch(`/api/wartungen/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (data.success) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Custom Fields
  const handleAddCustomField = async (item: Omit<CustomFieldDefinition, 'id'>) => {
    try {
      const res = await fetch('/api/custom-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item, role })
      });
      const data = await res.json();
      if (data.success) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCustomField = async (id: string) => {
    try {
      const res = await fetch(`/api/custom-fields/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (data.success) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Templates
  const handleEditEmailTemplate = async (type: 'invoice' | 'dunning' | 'maintenance', template: string) => {
    try {
      const res = await fetch('/api/settings/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, template, role })
      });
      const data = await res.json();
      if (data.success) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // API Token
  const handleSaveToken = async (token: string) => {
    try {
      const res = await fetch('/api/settings/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, role })
      });
      const data = await res.json();
      if (data.success) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Clear Audit Logs
  const handleClearLogs = async () => {
    try {
      const res = await fetch('/api/audit-logs/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (data.success) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Reset DB
  const handleResetDb = async () => {
    try {
      const res = await fetch('/api/actions/reset-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (data.success) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Trigger automated monthly invoicing
  const onTriggerMonthlyRent = async (monat: string) => {
    const res = await fetch('/api/actions/generate-monthly-rent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monat, role })
    });
    return await res.json();
  };

  // Trigger automated dunning process
  const onTriggerDunning = async () => {
    const res = await fetch('/api/actions/run-dunning', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    return await res.json();
  };

  // Trigger test email dispatch
  const onSendTestEmail = async (mieterId: string, subject: string, body: string) => {
    const res = await fetch('/api/actions/send-test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mieterId, subject, body, role })
    });
    return await res.json();
  };

  // General Audit manual logger helper
  const onLogAudit = async (action: string, details: string, section: string) => {
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, details, section, user: 'SYSTEM', role })
      });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !db) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200/80 p-8 shadow-sm text-center max-w-sm space-y-4">
          <RefreshCw className="w-8 h-8 text-gray-900 mx-auto animate-spin" />
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Sachsen Garagen-System</h3>
            <p className="text-xs text-gray-400 mt-1">Lade Systemdaten, Verschlüsselungstoken und Protokolle...</p>
          </div>
        </div>
      </div>
    );
  }

  // Navigation tab items configuration
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'standorte', label: 'Standorte', icon: Building2 },
    { id: 'stellplaetze', label: 'Garagen', icon: Warehouse },
    { id: 'mieter', label: 'Mieter', icon: Users2 },
    { id: 'vertraege', label: 'Verträge', icon: FileSignature },
    { id: 'finanzen', label: 'Abrechnung', icon: Coins },
    { id: 'wartung', label: 'Wartung', icon: Wrench },
    { id: 'emails', label: 'E-Mail', icon: Mail },
    { id: 'api', label: 'API Sandbox', icon: Cpu },
    { id: 'audit', label: 'Sicherheit', icon: ShieldCheck },
    { id: 'settings', label: 'Einstellungen', icon: Settings2 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* -------------------------------------------------------------
          LEFT SIDEBAR: NAVIGATION MENU
          ------------------------------------------------------------- */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-slate-300 border-r border-slate-800/50 flex flex-col justify-between transform transition-transform duration-200 lg:translate-x-0 lg:static lg:h-screen ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand Logo and Title */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-700/50 bg-transparent shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-600 text-white rounded-lg font-extrabold text-xs tracking-wider shadow-sm">CG</div>
              <div>
                <h1 className="font-bold text-sm text-white uppercase tracking-tight">Centa<span className="text-blue-400">Garagen</span></h1>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5 font-semibold">Management Suite v4.2</p>
              </div>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-1">
            <div className="text-[10px] text-slate-500 font-bold mb-2 ml-2 uppercase tracking-wider">Navigation</div>
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium tracking-wide transition-all ${
                    isActive 
                      ? 'bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/10' 
                      : 'hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-colors'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-700/50 mt-auto">
          <div className="bg-slate-800/50 rounded-lg p-3 text-[11px]">
            <div className="flex justify-between items-center mb-1 text-slate-400 font-semibold uppercase">
              <span>API Status</span>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
            </div>
            <p className="text-slate-300">Endpoint: v1.cloud.live</p>
            <p className="mt-1 text-slate-500 font-medium">Rolle: {role}</p>
          </div>
        </div>
      </aside>

      {/* -------------------------------------------------------------
          MAIN CONTAINER (TOP BAR + CONTENT STAGE)
          ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto lg:h-screen">
        
        {/* Top bar header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-900 p-1.5 hover:bg-gray-50 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <p className="text-[10px] font-mono text-slate-400">Verwaltungs-Dashboard</p>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Centa Garagenverwaltung</h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Filter Info */}
            {selectedStandortFilter !== 'All' && (
              <span className="hidden md:inline-flex bg-blue-50 text-blue-700 font-semibold border border-blue-100 text-[10px] px-2.5 py-1 rounded-md">
                Filter: {db.standorte.find(s => s.id === selectedStandortFilter)?.name || ''}
              </span>
            )}

            {/* Quick role toggle in top-bar */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 p-1 rounded-lg">
              <span className="text-[10px] font-semibold text-slate-400 px-1.5 hidden sm:inline">Rolle:</span>
              <select
                value={role}
                onChange={e => setRole(e.target.value as any)}
                className="text-[10px] font-bold text-slate-700 bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none"
              >
                <option value="Administrator">Administrator</option>
                <option value="Nutzer">Operator / Nutzer</option>
              </select>
            </div>
          </div>
        </header>

        {/* -------------------------------------------------------------
            CONTENT COMPONENT RENDER ENGINE
            ------------------------------------------------------------- */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'dashboard' && (
                <Dashboard 
                  db={db} 
                  role={role}
                  setActiveTab={setActiveTab} 
                  triggerMonthlyRent={onTriggerMonthlyRent}
                  triggerDunning={onTriggerDunning}
                />
              )}

              {activeTab === 'standorte' && (
                <StandorteManager
                  db={db}
                  role={role}
                  onAddStandort={handleAddStandort}
                  onEditStandort={handleEditStandort}
                  onDeleteStandort={handleDeleteStandort}
                  setActiveTab={setActiveTab}
                  setSelectedStandortFilter={setSelectedStandortFilter}
                />
              )}

              {activeTab === 'stellplaetze' && (
                <StellplaetzeManager
                  db={db}
                  role={role}
                  onAddStellplatz={handleAddStellplatz}
                  onEditStellplatz={handleEditStellplatz}
                  onDeleteStellplatz={handleDeleteStellplatz}
                  selectedStandortFilter={selectedStandortFilter}
                  setSelectedStandortFilter={setSelectedStandortFilter}
                />
              )}

              {activeTab === 'mieter' && (
                <MieterManager
                  db={db}
                  role={role}
                  onAddMieter={handleAddMieter}
                  onEditMieter={handleEditMieter}
                  onDeleteMieter={handleDeleteMieter}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === 'vertraege' && (
                <VertraegeManager
                  db={db}
                  role={role}
                  onAddVertrag={handleAddVertrag}
                  onEditVertrag={handleEditVertrag}
                  onDeleteVertrag={handleDeleteVertrag}
                  onLogAudit={onLogAudit}
                />
              )}

              {activeTab === 'finanzen' && (
                <FinanzenManager
                  db={db}
                  role={role}
                  onAddZahlung={handleAddZahlung}
                  onEditZahlung={handleEditZahlung}
                  onDeleteZahlung={handleDeleteZahlung}
                  onTriggerMonthlyRent={onTriggerMonthlyRent}
                  onTriggerDunning={onTriggerDunning}
                  refreshData={loadData}
                />
              )}

              {activeTab === 'wartung' && (
                <WartungManager
                  db={db}
                  role={role}
                  onAddWartung={handleAddWartung}
                  onEditWartung={handleEditWartung}
                  onDeleteWartung={handleDeleteWartung}
                />
              )}

              {activeTab === 'emails' && (
                <EmailSystem
                  db={db}
                  role={role}
                  onEditEmailTemplate={handleEditEmailTemplate}
                  onSendTestEmail={onSendTestEmail}
                />
              )}

              {activeTab === 'api' && (
                <ApiSandbox
                  db={db}
                  role={role}
                />
              )}

              {activeTab === 'audit' && (
                <AuditLogViewer
                  db={db}
                  role={role}
                  onClearLogs={handleClearLogs}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsManager
                  db={db}
                  role={role}
                  onChangeRole={setRole}
                  onAddCustomField={handleAddCustomField}
                  onDeleteCustomField={handleDeleteCustomField}
                  onResetDb={handleResetDb}
                  onSaveToken={handleSaveToken}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

      </div>
    </div>
  );
}
