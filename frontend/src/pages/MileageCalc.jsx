import React, { useState } from 'react';
import { 
  Gauge, 
  Info, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Calculator, 
  TrendingUp, 
  Award,
  ArrowRight
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { LoadingSpinner } from '../components/Loading';
import { mileageService } from '../services/api';

export default function MileageCalc({ 
  mileageSummaries = [], 
  vehicles = [], 
  loading, 
  selectedVehicleId, 
  setSelectedVehicleId, 
  currencySymbol = '₹', 
  distanceUnit = 'km', 
  fuelUnit = 'litres' 
}) {
  // Interactive what-if calculator state
  const [calcInputs, setCalcInputs] = useState({
    prevOdo: '',
    currOdo: '',
    fuelQty: '',
  });
  const [calcResult, setCalcResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Active vehicle summary
  const activeSummary = selectedVehicleId
    ? mileageSummaries.find((s) => s.vehicle_id === selectedVehicleId)
    : mileageSummaries[0];

  const handleSimulate = async (e) => {
    e.preventDefault();
    const prev = parseFloat(calcInputs.prevOdo);
    const curr = parseFloat(calcInputs.currOdo);
    const fuel = parseFloat(calcInputs.fuelQty);

    if (isNaN(prev) || isNaN(curr) || isNaN(fuel)) {
      setCalcResult({ error: 'Please enter valid numbers for all fields.' });
      return;
    }

    setIsSimulating(true);
    try {
      const res = await mileageService.simulate({
        previous_odometer: prev,
        current_odometer: curr,
        fuel_consumed: fuel,
      });
      setCalcResult(res);
    } catch (err) {
      setCalcResult({ error: err.message || 'Simulation failed.' });
    } finally {
      setIsSimulating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Computing consecutive full-tank mileage..." />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Fuel Mileage & Efficiency Engine
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Precision fuel economy calculations based on verified consecutive full-tank refills.
        </p>
      </div>

      {/* Full-Tank Methodology Explainer Banner */}
      <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-blue-500 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 shrink-0">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">
              Why Consecutive Full-Tank Records Matter
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-3xl">
              Fuel gauge readings are non-linear. The most reliable automotive standard for mileage is the 
              <strong> full-tank to full-tank method</strong>:
              <span className="block mt-1 font-mono text-blue-300">
                Distance Travelled = Current Odometer − Previous Odometer
              </span>
              <span className="block font-mono text-emerald-300">
                Mileage = Distance Travelled ÷ Current Refuel Quantity ({distanceUnit}/{fuelUnit})
              </span>
              Single baseline entries, partial fills, and decreasing odometers are automatically guarded against to keep metrics pure.
            </p>
          </div>
        </div>
      </div>

      {/* Vehicle Switcher Bar */}
      {vehicles.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {vehicles.map((v) => {
            const isSelected = (selectedVehicleId || mileageSummaries[0]?.vehicle_id) === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setSelectedVehicleId(v.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {v.name} ({v.registration_number})
              </button>
            );
          })}
        </div>
      )}

      {/* 4 Stat Cards for Current Vehicle */}
      {activeSummary ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Latest Mileage"
              value={activeSummary.latest_mileage !== null ? `${activeSummary.latest_mileage}` : 'N/A'}
              unit={activeSummary.latest_mileage !== null ? `${distanceUnit}/${fuelUnit}` : ''}
              icon={Gauge}
              color="blue"
              subtitle={`Most recent full-tank test`}
            />
            <StatCard
              title="Average Mileage"
              value={activeSummary.average_mileage !== null ? `${activeSummary.average_mileage}` : 'N/A'}
              unit={activeSummary.average_mileage !== null ? `${distanceUnit}/${fuelUnit}` : ''}
              icon={TrendingUp}
              color="emerald"
              subtitle={`Lifetime verified average`}
            />
            <StatCard
              title="Best Recorded"
              value={activeSummary.best_mileage !== null ? `${activeSummary.best_mileage}` : 'N/A'}
              unit={activeSummary.best_mileage !== null ? `${distanceUnit}/${fuelUnit}` : ''}
              icon={Award}
              color="amber"
              subtitle={`Peak efficiency milestone`}
            />
            <StatCard
              title="Distance Tracked"
              value={`${activeSummary.total_distance_tracked.toLocaleString()}`}
              unit={distanceUnit}
              icon={Gauge}
              color="indigo"
              subtitle={`Over ${activeSummary.total_fuel_consumed} ${fuelUnit} fuel`}
            />
          </div>

          {/* Mileage History Table */}
          <div className="glass-panel rounded-2xl overflow-hidden border">
            <div className="p-5 border-b border-slate-700/60 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  Mileage Log History — {activeSummary.vehicle_name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Calculated records in reverse chronological order
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {activeSummary.valid_calculation_count} Valid Cycles
              </span>
            </div>

            {activeSummary.history.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No fuel refill records found for this vehicle.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/60 border-b border-slate-700/60">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Refuel Date</th>
                      <th className="py-3 px-4 font-semibold text-right">Odometer</th>
                      <th className="py-3 px-4 font-semibold text-right">Distance Run</th>
                      <th className="py-3 px-4 font-semibold text-right">Fuel Consumed</th>
                      <th className="py-3 px-4 font-semibold text-right">Calculated Mileage</th>
                      <th className="py-3 px-4 font-semibold text-center">Status / Validation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {activeSummary.history.map((h) => {
                      const isValid = h.mileage_kmpl !== null;
                      return (
                        <tr key={h.log_id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 text-xs font-medium text-slate-300 whitespace-nowrap">
                            {h.refuel_date}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-200">
                            {h.current_odometer.toLocaleString()} {distanceUnit}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-300">
                            {h.distance_travelled !== null ? `${h.distance_travelled.toLocaleString()} ${distanceUnit}` : '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-blue-300">
                            {h.fuel_consumed.toFixed(2)} {fuelUnit}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {isValid ? (
                              <span className="font-extrabold text-emerald-400 font-mono text-sm">
                                {h.mileage_kmpl} <span className="text-[11px] font-normal text-slate-400">{distanceUnit}/{fuelUnit}</span>
                              </span>
                            ) : (
                              <span className="text-slate-500 font-mono text-xs">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-full ${
                                isValid
                                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {h.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-panel p-12 text-center rounded-2xl">
          <p className="text-slate-400">Please register a vehicle and log at least 2 refuels to view calculated mileage.</p>
        </div>
      )}

      {/* Interactive What-If Mileage Simulator */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Instant Mileage Simulator & What-If Calculator
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate trip efficiency and test odometer readings before logging
            </p>
          </div>
        </div>

        <form onSubmit={handleSimulate} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Previous Odometer ({distanceUnit})
            </label>
            <input
              type="number"
              step="0.1"
              required
              placeholder="e.g. 12000"
              value={calcInputs.prevOdo}
              onChange={(e) => setCalcInputs({ ...calcInputs, prevOdo: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Current Odometer ({distanceUnit})
            </label>
            <input
              type="number"
              step="0.1"
              required
              placeholder="e.g. 12520"
              value={calcInputs.currOdo}
              onChange={(e) => setCalcInputs({ ...calcInputs, currOdo: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Fuel Consumed ({fuelUnit})
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="e.g. 32.5"
              value={calcInputs.fuelQty}
              onChange={(e) => setCalcInputs({ ...calcInputs, fuelQty: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isSimulating}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              {isSimulating ? 'Calculating...' : 'Calculate Mileage'}
            </button>
          </div>
        </form>

        {calcResult && (
          <div className="mt-5 p-4 rounded-xl border bg-slate-900/80 border-slate-700">
            {calcResult.error ? (
              <p className="text-rose-400 text-xs font-medium">{calcResult.error}</p>
            ) : calcResult.is_valid ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    {calcResult.status}
                  </span>
                  <p className="text-xs text-slate-300 mt-1">{calcResult.message}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Efficiency</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    {calcResult.mileage_kmpl} <span className="text-xs font-normal text-slate-300">{distanceUnit}/{fuelUnit}</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-300 text-xs font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{calcResult.message}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
