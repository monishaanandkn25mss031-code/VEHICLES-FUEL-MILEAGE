import React, { useState, useEffect } from 'react';
import { 
  Fuel, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  AlertCircle, 
  HelpCircle,
  Calendar,
  Filter
} from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { LoadingSpinner } from '../components/Loading';

export default function FuelTracker({ 
  fuelLogs = [], 
  vehicles = [], 
  loading, 
  onAddFuelLog, 
  onUpdateFuelLog, 
  onDeleteFuelLog,
  selectedVehicleId,
  setSelectedVehicleId,
  currencySymbol = '₹', 
  distanceUnit = 'km', 
  fuelUnit = 'litres' 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form state
  const initialFormState = {
    vehicle_id: vehicles[0]?.id || '',
    refuel_date: new Date().toISOString().split('T')[0],
    odometer_reading: '',
    fuel_quantity: '',
    price_per_litre: '',
    total_cost: '',
    is_full_tank: true,
    notes: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  // Auto-calculate total cost: Total Cost = Fuel Quantity × Price per Litre
  useEffect(() => {
    const qty = parseFloat(formData.fuel_quantity);
    const price = parseFloat(formData.price_per_litre);
    if (!isNaN(qty) && !isNaN(price) && qty > 0 && price >= 0) {
      setFormData((prev) => ({
        ...prev,
        total_cost: (qty * price).toFixed(2),
      }));
    }
  }, [formData.fuel_quantity, formData.price_per_litre]);

  const openAddModal = () => {
    setEditingLog(null);
    setFormData({
      ...initialFormState,
      vehicle_id: selectedVehicleId || vehicles[0]?.id || '',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (log) => {
    setEditingLog(log);
    setFormData({
      vehicle_id: log.vehicle_id,
      refuel_date: log.refuel_date,
      odometer_reading: log.odometer_reading,
      fuel_quantity: log.fuel_quantity,
      price_per_litre: log.price_per_litre,
      total_cost: log.total_cost,
      is_full_tank: log.is_full_tank,
      notes: log.notes || '',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (!formData.vehicle_id) throw new Error('Please select a vehicle.');
      const odo = parseFloat(formData.odometer_reading);
      const qty = parseFloat(formData.fuel_quantity);
      const price = parseFloat(formData.price_per_litre);

      if (isNaN(odo) || odo < 0) throw new Error('Odometer reading must be a positive number.');
      if (isNaN(qty) || qty <= 0) throw new Error('Fuel quantity must be greater than zero.');
      if (isNaN(price) || price < 0) throw new Error('Price per litre cannot be negative.');

      const calculatedTotal = parseFloat(formData.total_cost) || (qty * price);

      const payload = {
        vehicle_id: formData.vehicle_id,
        refuel_date: formData.refuel_date,
        odometer_reading: odo,
        fuel_quantity: qty,
        price_per_litre: price,
        total_cost: calculatedTotal,
        is_full_tank: formData.is_full_tank,
        notes: formData.notes?.trim() || null,
      };

      if (editingLog) {
        await onUpdateFuelLog(editingLog.id, payload);
      } else {
        await onAddFuelLog(payload);
      }
      setIsModalOpen(false);
    } catch (err) {
      setErrorMsg(err.message || 'Operation failed. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await onDeleteFuelLog(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      alert(err.message || 'Failed to delete fuel log.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter logs if vehicle selector is active
  const filteredLogs = selectedVehicleId
    ? fuelLogs.filter((l) => l.vehicle_id === selectedVehicleId)
    : fuelLogs;

  const totalFuelCost = filteredLogs.reduce((acc, curr) => acc + (parseFloat(curr.total_cost) || 0), 0);
  const totalFuelLitres = filteredLogs.reduce((acc, curr) => acc + (parseFloat(curr.fuel_quantity) || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Fuel Log & Expense Tracker
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Record every refuelling stop. Costs are automatically calculated using:
            <span className="font-mono text-blue-300 ml-1">Total Cost = Quantity × Price/Litre</span>
          </p>
        </div>
        <button
          onClick={openAddModal}
          disabled={vehicles.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Log Refuelling
        </button>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-xl">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total Entries</span>
          <p className="text-2xl font-bold text-white mt-1">{filteredLogs.length}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total Fuel Volume</span>
          <p className="text-2xl font-bold text-blue-400 mt-1">
            {totalFuelLitres.toFixed(1)} <span className="text-xs text-slate-400">{fuelUnit}</span>
          </p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total Fuel Expenses</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {currencySymbol}{totalFuelCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Fuel Logs Table */}
      {loading ? (
        <LoadingSpinner text="Fetching fuel records..." />
      ) : filteredLogs.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl max-w-lg mx-auto">
          <Fuel className="w-12 h-12 text-blue-400 mx-auto mb-3 opacity-80" />
          <h3 className="text-lg font-bold text-white">No Fuel Logs Recorded</h3>
          <p className="text-sm text-slate-400 mt-1 mb-6">
            Log your petrol or diesel receipts to view mileage and expenses.
          </p>
          <button
            onClick={openAddModal}
            disabled={vehicles.length === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 disabled:opacity-50"
          >
            {vehicles.length === 0 ? 'Add a Vehicle First' : 'Log Refuelling'}
          </button>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/60 border-b border-slate-700/60">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Date</th>
                  <th className="py-3.5 px-4 font-semibold">Vehicle</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Odometer ({distanceUnit})</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Volume ({fuelUnit})</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Price/{fuelUnit}</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Total Cost ({currencySymbol})</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Tank Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-xs font-medium text-slate-300 whitespace-nowrap">
                      {log.refuel_date}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {log.vehicle_name}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-200">
                      {log.odometer_reading.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-blue-300 font-medium">
                      {log.fuel_quantity.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300">
                      {currencySymbol}{log.price_per_litre.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400 font-mono">
                      {currencySymbol}{log.total_cost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full ${
                          log.is_full_tank
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-950/80 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {log.is_full_tank ? 'Full Tank' : 'Partial'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(log)}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit Log"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(log)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Delete Log"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Fuel Log Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLog ? 'Edit Fuel Refill Log' : 'Record New Fuel Refill'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Select Vehicle *
            </label>
            <select
              value={formData.vehicle_id}
              onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="" disabled>Choose a vehicle...</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.registration_number}) - {v.fuel_type}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Refuel Date *
              </label>
              <input
                type="date"
                required
                value={formData.refuel_date}
                onChange={(e) => setFormData({ ...formData, refuel_date: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Odometer Reading ({distanceUnit}) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                placeholder="e.g. 14500"
                value={formData.odometer_reading}
                onChange={(e) => setFormData({ ...formData, odometer_reading: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Fuel Quantity ({fuelUnit}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="e.g. 35.5"
                value={formData.fuel_quantity}
                onChange={(e) => setFormData({ ...formData, fuel_quantity: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Price per {fuelUnit} ({currencySymbol}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="e.g. 102.50"
                value={formData.price_per_litre}
                onChange={(e) => setFormData({ ...formData, price_per_litre: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Auto-Calculated Total Cost Display */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-blue-500/20 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Total Fuel Cost (Auto-Calculated)</span>
              <span className="text-xs text-slate-400 font-mono">Qty × Price/Litre</span>
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono">
              {currencySymbol}{formData.total_cost || '0.00'}
            </div>
          </div>

          {/* Full-Tank Checkbox */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <input
              type="checkbox"
              id="is_full_tank"
              checked={formData.is_full_tank}
              onChange={(e) => setFormData({ ...formData, is_full_tank: e.target.checked })}
              className="mt-1 w-4 h-4 text-blue-600 rounded bg-slate-800 border-slate-700 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="is_full_tank" className="text-xs text-slate-300 cursor-pointer">
              <span className="font-semibold text-white block">Full-Tank Refuel (Recommended for Mileage)</span>
              Keep checked if you filled the tank up to the auto-cut-off point. Consecutive full-tanks enable 100% accurate mileage calculation.
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Shell Petrol Pump, Highway trip"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/60 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingLog ? 'Update Refuel Entry' : 'Save Refuel Log'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Fuel Entry"
        message={`Are you sure you want to delete the fuel log for ${deleteTarget?.vehicle_name} on ${deleteTarget?.refuel_date} (${currencySymbol}${deleteTarget?.total_cost})?`}
        confirmText="Delete Entry"
        isDeleting={isSubmitting}
      />
    </div>
  );
}
