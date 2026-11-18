import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Database, 
  Save, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { settingsService } from '../services/api';
import { LoadingSpinner } from '../components/Loading';

export default function Settings({ 
  currentSettings, 
  onSaveSettings, 
  currencySymbol = '₹', 
  distanceUnit = 'km', 
  fuelUnit = 'litres' 
}) {
  const [formData, setFormData] = useState({
    app_name: 'Vehicle Service & Fuel Mileage Logger',
    currency_symbol: '₹',
    currency_code: 'INR',
    distance_unit: 'km',
    fuel_unit: 'litres',
  });
  const [dbStatus, setDbStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (currentSettings) {
      setFormData({
        app_name: currentSettings.app_name || 'Vehicle Service & Fuel Mileage Logger',
        currency_symbol: currentSettings.currency_symbol || '₹',
        currency_code: currentSettings.currency_code || 'INR',
        distance_unit: currentSettings.distance_unit || 'km',
        fuel_unit: currentSettings.fuel_unit || 'litres',
      });
    }
    fetchStatus();
  }, [currentSettings]);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const status = await settingsService.getStatus();
      setDbStatus(status);
    } catch (err) {
      setDbStatus({
        status: 'Error communicating with backend',
        engine: 'Unknown',
        supabase_configured: false,
      });
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setIsSaving(true);
    try {
      await onSaveSettings(formData);
      setSuccessMsg('Settings saved successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Application Settings & Environment
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Customize currency symbols, default units, and verify Supabase PostgreSQL connection status.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Database Connection Status Card */}
      <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-emerald-500">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Database & API Status</h3>
              <p className="text-xs text-slate-400">Underlying storage engine and connectivity</p>
            </div>
          </div>
          <button
            onClick={fetchStatus}
            disabled={loadingStatus}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 border border-slate-700/60 transition-colors"
            title="Refresh Status"
          >
            <RefreshCw className={`w-4 h-4 ${loadingStatus ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>

        {dbStatus ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400 block font-semibold">Active Engine</span>
              <span className="text-sm font-bold text-white mt-1 block">
                {dbStatus.engine}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400 block font-semibold">Supabase Configured</span>
              <span className={`text-sm font-bold mt-1 block ${dbStatus.supabase_configured ? 'text-emerald-400' : 'text-amber-400'}`}>
                {dbStatus.supabase_configured ? 'Yes (Remote Database Active)' : 'No (Using Local SQLite Database)'}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400 block font-semibold">API Health</span>
              <span className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Operational
              </span>
            </div>
          </div>
        ) : (
          <LoadingSpinner text="Checking connection..." />
        )}
      </div>

      {/* Settings Form */}
      <div className="glass-panel p-6 rounded-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h3 className="text-base font-bold text-white pb-3 border-b border-slate-700/60">
            Localization & Measurement Units
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Application Title
            </label>
            <input
              type="text"
              required
              value={formData.app_name}
              onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Currency Symbol
              </label>
              <input
                type="text"
                required
                value={formData.currency_symbol}
                onChange={(e) => setFormData({ ...formData, currency_symbol: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="₹"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Default: ₹ (Indian Rupee)</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Currency Code
              </label>
              <input
                type="text"
                required
                value={formData.currency_code}
                onChange={(e) => setFormData({ ...formData, currency_code: e.target.value.toUpperCase() })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="INR"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Standard 3-letter ISO code</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Distance Unit
              </label>
              <select
                value={formData.distance_unit}
                onChange={(e) => setFormData({ ...formData, distance_unit: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="km">Kilometres (km)</option>
                <option value="miles">Miles (mi)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Fuel Volume Unit
              </label>
              <select
                value={formData.fuel_unit}
                onChange={(e) => setFormData({ ...formData, fuel_unit: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="litres">Litres (L)</option>
                <option value="gallons">Gallons (gal)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700/60 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Supabase Connection Instructions */}
      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-base font-bold text-white mb-2">
          Connecting to your Supabase PostgreSQL Project
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          To switch the backend from local SQLite storage to your Supabase PostgreSQL cloud database:
        </p>
        <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1.5 mt-3">
          <li>Create a project in the <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-blue-400 underline">Supabase Dashboard</a>.</li>
          <li>Open the Supabase <strong>SQL Editor</strong> and execute the contents of <code className="bg-slate-900 px-1.5 py-0.5 rounded text-blue-300">schema.sql</code>.</li>
          <li>Copy your project URL and <code className="bg-slate-900 px-1.5 py-0.5 rounded text-blue-300">anon</code> public key from <strong>Project Settings → API</strong>.</li>
          <li>Paste them into <code className="bg-slate-900 px-1.5 py-0.5 rounded text-blue-300">backend/.env</code> under <code className="text-emerald-400">SUPABASE_URL</code> and <code className="text-emerald-400">SUPABASE_KEY</code>.</li>
          <li>Restart the backend service. The engine will instantly connect and switch to Supabase mode!</li>
        </ol>
      </div>
    </div>
  );
}
