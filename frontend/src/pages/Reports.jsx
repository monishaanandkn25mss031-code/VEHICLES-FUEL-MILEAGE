import React from 'react';
import { 
  BarChart3, 
  Fuel, 
  Wrench, 
  Coins, 
  TrendingUp, 
  Car,
  PieChart as PieIcon 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid,
  Cell
} from 'recharts';
import StatCard from '../components/StatCard';
import { LoadingSpinner } from '../components/Loading';

const VEHICLE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function Reports({ 
  analytics, 
  loading, 
  currencySymbol = '₹', 
  distanceUnit = 'km', 
  fuelUnit = 'litres' 
}) {
  if (loading) {
    return <LoadingSpinner text="Generating analytical reports & charts..." />;
  }

  if (!analytics) {
    return (
      <div className="text-center py-16 text-slate-400">
        <p>No analytical data available yet. Add vehicles, fuel logs, and service records to view reports.</p>
      </div>
    );
  }

  const {
    total_vehicles = 0,
    total_fuel_cost = 0,
    total_service_cost = 0,
    total_maintenance_cost = 0,
    monthly_expenses = [],
    vehicle_expenses = [],
    mileage_trends = [],
  } = analytics;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Reports & Financial Analytics
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          In-depth financial tracking, cost-per-vehicle distribution, and historical mileage trends.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Maintenance Cost"
          value={`${currencySymbol}${total_maintenance_cost.toLocaleString('en-IN')}`}
          icon={Coins}
          color="blue"
          subtitle="Fuel + Workshop spend"
        />
        <StatCard
          title="Total Fuel Spend"
          value={`${currencySymbol}${total_fuel_cost.toLocaleString('en-IN')}`}
          icon={Fuel}
          color="indigo"
          subtitle={`${((total_fuel_cost / (total_maintenance_cost || 1)) * 100).toFixed(0)}% of total spend`}
        />
        <StatCard
          title="Total Service Spend"
          value={`${currencySymbol}${total_service_cost.toLocaleString('en-IN')}`}
          icon={Wrench}
          color="amber"
          subtitle={`${((total_service_cost / (total_maintenance_cost || 1)) * 100).toFixed(0)}% of total spend`}
        />
        <StatCard
          title="Monitored Vehicles"
          value={total_vehicles}
          icon={Car}
          color="emerald"
          subtitle="Contributing to analytics"
        />
      </div>

      {/* Monthly Expenses Chart */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              Monthly Fuel vs Service Expenses
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cumulative expenditure over time in {currencySymbol}
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
                  formatter={(val) => [`${currencySymbol}${Number(val).toLocaleString('en-IN')}`, '']}
                />
                <Bar dataKey="fuel_expense" name="Fuel" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="service_expense" name="Service" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
            No monthly data to chart yet.
          </div>
        )}
      </div>

      {/* Two Column Section: Mileage Trends & Vehicle Expense Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mileage Trends Over Time */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Mileage Efficiency Trends ({distanceUnit}/{fuelUnit})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Historical fuel economy performance across refuelling runs
            </p>
          </div>

          {mileage_trends.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mileage_trends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#f8fafc',
                    }}
                    formatter={(val) => [`${val} ${distanceUnit}/${fuelUnit}`, 'Mileage']}
                  />
                  <Line
                    type="monotone"
                    dataKey="mileage_kmpl"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-500 text-xs">
              Log at least two consecutive full-tank refills to chart mileage trends.
            </div>
          )}
        </div>

        {/* Vehicle Expense Distribution Breakdown */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-blue-400" />
              Total Cost Distribution by Vehicle
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Combined fuel & maintenance spending per vehicle
            </p>
          </div>

          {vehicle_expenses.length > 0 ? (
            <div className="space-y-4 pt-2">
              {vehicle_expenses.map((ve, idx) => {
                const percent = total_maintenance_cost > 0
                  ? ((ve.total_cost / total_maintenance_cost) * 100).toFixed(1)
                  : 0;
                const barColor = VEHICLE_COLORS[idx % VEHICLE_COLORS.length];

                return (
                  <div key={ve.vehicle_id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div>
                        <span className="font-bold text-white">{ve.vehicle_name}</span>
                        <span className="text-slate-400 font-mono text-[11px] ml-1.5">({ve.registration_number})</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-white font-mono">
                          {currencySymbol}{ve.total_cost.toLocaleString('en-IN')}
                        </span>
                        <span className="text-slate-400 ml-1.5">({percent}%)</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%`, backgroundColor: barColor }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                      <span>Fuel: {currencySymbol}{ve.fuel_cost.toLocaleString('en-IN')}</span>
                      <span>Service: {currencySymbol}{ve.service_cost.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-500 text-xs">
              No vehicle expenses recorded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
