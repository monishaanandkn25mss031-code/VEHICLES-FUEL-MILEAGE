import React from 'react';
import { Menu, RefreshCw, PlusCircle, Car, Fuel, Wrench } from 'lucide-react';

export default function Navbar({ 
  onMenuClick, 
  vehicles = [], 
  selectedVehicleId, 
  setSelectedVehicleId, 
  onRefresh, 
  isRefreshing,
  onQuickAction,
  currencySymbol = '₹'
}) {
  return (
    <header className="sticky top-0 z-30 bg-[#0b1329]/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Menu Trigger + Title / Filter */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Vehicle Selector Dropdown */}
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-blue-400 hidden sm:inline-block" />
            <select
              value={selectedVehicleId || ''}
              onChange={(e) => setSelectedVehicleId(e.target.value || null)}
              className="bg-slate-800/90 text-sm font-medium text-slate-200 border border-slate-700/80 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-slate-600 cursor-pointer"
            >
              <option value="">All Vehicles ({vehicles.length})</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.registration_number})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Quick Actions & Refresh */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => onQuickAction && onQuickAction('add-fuel')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-300 bg-blue-950/60 hover:bg-blue-900/60 border border-blue-500/30 rounded-xl transition-all"
          >
            <Fuel className="w-3.5 h-3.5 text-blue-400" />
            + Fuel
          </button>
          <button
            onClick={() => onQuickAction && onQuickAction('add-service')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 rounded-xl transition-all"
          >
            <Wrench className="w-3.5 h-3.5 text-emerald-400" />
            + Service
          </button>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 border border-slate-700/50 transition-colors disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
