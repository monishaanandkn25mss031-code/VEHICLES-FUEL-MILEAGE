import React from 'react';
import { 
  Car, 
  Fuel, 
  Gauge, 
  Wrench, 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  ArrowUpRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import StatCard from '../components/StatCard';
import { LoadingSpinner } from '../components/Loading';

export default function Dashboard({ 
  stats, 
  loading, 
  onNavigate, 
  currencySymbol = '₹', 
  distanceUnit = 'km', 
  fuelUnit = 'litres' 
}) {
  if (loading) {
    return <LoadingSpinner text="Loading dashboard metrics..." />;
  }

  if (!stats) {
    return (
      <div className="text-center py-16 text-slate-400">
        <p>No dashboard statistics available. Please add a vehicle to get started.</p>
      </div>
    );
  }

  const {
    total_vehicles = 0,
    total_fuel_expenses = 0,
    average_fuel_mileage = null,
    total_service_expenses = 0,
    total_overall_expenses = 0,
    recent_fuel_entries = [],
    recent_service_records = [],
    upcoming_reminders = [],
    monthly_expenses = [],
  } = stats;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome & KPI Metric Cards */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Vehicle Overview & Telemetry
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Real-time monitoring of fuel consumption, maintenance schedules, and efficiency.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Fleet Size: {total_vehicles} Active
            </span>
          </div>
        </div>

        {/* 4 Primary KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Registered Vehicles"
            value={total_vehicles}
            icon={Car}
            color="blue"
            subtitle="Cars, bikes & commercial"
            badge={{ label: "Manage fleet", value: "View All →" }}
          />
          <StatCard
            title="Total Fuel Spent"
            value={`${currencySymbol}${total_fuel_expenses.toLocaleString('en-IN')}`}
            icon={Fuel}
            color="indigo"
            subtitle="Lifetime refuelling expense"
            badge={{ label: "Unit", value: fuelUnit }}
          />
          <StatCard
            title="Fleet Avg Mileage"
            value={average_fuel_mileage ? `${average_fuel_mileage}` : 'N/A'}
            unit={average_fuel_mileage ? `${distanceUnit}/${fuelUnit}` : ''}
            icon={Gauge}
            color="emerald"
            subtitle="Consecutive full-tank baseline"
            badge={{ label: "Calculation", value: "Verified Full-Tank" }}
          />
          <StatCard
            title="Service Expenses"
            value={`${currencySymbol}${total_service_expenses.toLocaleString('en-IN')}`}
            icon={Wrench}
            color="amber"
            subtitle="Total workshop & parts spend"
            badge={{ label: "Combined", value: `${currencySymbol}${total_overall_expenses.toLocaleString('en-IN')}` }}
          />
        </div>
      </div>

      {/* Maintenance Reminders Banner (if any) */}
      {upcoming_reminders.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white tracking-wide">
                Upcoming Maintenance Alerts ({upcoming_reminders.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigate('service')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              View Service History →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {upcoming_reminders.slice(0, 3).map((r) => {
              const isUrgent = r.urgency === 'urgent';
              return (
                <div
                  key={r.id}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                    isUrgent
                      ? 'bg-rose-950/30 border-rose-500/30 text-rose-200'
                      : 'bg-amber-950/20 border-amber-500/20 text-amber-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-white">{r.vehicle_name}</h4>
                      <p className="text-xs text-slate-300 mt-0.5">{r.service_type}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full ${
                        isUrgent
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {isUrgent ? 'Action Needed' : 'Due Soon'}
                    </span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-white/10 text-xs font-medium flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 opacity-80" />
                      {r.alert_message}
                    </span>
                    <span className="text-[11px] opacity-75">
                      Target: {r.next_service_due_date || `${r.next_service_due_odometer} ${distanceUnit}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Monthly Fuel & Service Expenses Chart */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">
              Monthly Expenditure Breakdown
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparison of fuel consumption vs service expenses in {currencySymbol}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-500"></span>
              <span className="text-slate-300">Fuel</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-500"></span>
              <span className="text-slate-300">Service</span>
            </div>
          </div>
        </div>

        {monthly_expenses.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly_expenses} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month_name" stroke="#64748b" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(value) => [`${currencySymbol}${value.toLocaleString('en-IN')}`, '']}
                />
                <Bar dataKey="fuel_expense" name="Fuel Expense" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="service_expense" name="Service Expense" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
            No expenses logged yet. Add your first fuel or service entry to view monthly trends.
          </div>
        )}
      </div>

      {/* Two-Column Grid: Recent Fuel Logs & Recent Service Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Fuel Entries */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Fuel className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-bold text-white">Recent Fuel Entries</h3>
            </div>
            <button
              onClick={() => onNavigate('fuel')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300"
            >
              Full Log →
            </button>
          </div>

          {recent_fuel_entries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700/60">
                  <tr>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Vehicle</th>
                    <th className="pb-3 font-semibold text-right">Volume</th>
                    <th className="pb-3 font-semibold text-right">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recent_fuel_entries.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 text-xs font-medium text-slate-300">{f.refuel_date}</td>
                      <td className="py-3 font-semibold text-white">{f.vehicle_name}</td>
                      <td className="py-3 text-right text-xs font-mono">{f.fuel_quantity} {fuelUnit}</td>
                      <td className="py-3 text-right font-bold text-blue-400">
                        {currencySymbol}{f.total_cost.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">
              No fuel entries recorded yet.
            </div>
          )}
        </div>

        {/* Recent Service Records */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Recent Service Records</h3>
            </div>
            <button
              onClick={() => onNavigate('service')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300"
            >
              Full History →
            </button>
          </div>

          {recent_service_records.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700/60">
                  <tr>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Vehicle & Type</th>
                    <th className="pb-3 font-semibold">Centre</th>
                    <th className="pb-3 font-semibold text-right">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recent_service_records.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 text-xs font-medium text-slate-300">{s.service_date}</td>
                      <td className="py-3">
                        <p className="font-semibold text-white text-xs">{s.vehicle_name}</p>
                        <p className="text-[11px] text-slate-400">{s.service_type}</p>
                      </td>
                      <td className="py-3 text-xs text-slate-400 truncate max-w-[120px]">
                        {s.service_centre || 'N/A'}
                      </td>
                      <td className="py-3 text-right font-bold text-amber-400">
                        {currencySymbol}{s.service_cost.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">
              No service records recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
