import React, { useState } from 'react';
import { 
  Car, 
  Plus, 
  Edit3, 
  Trash2, 
  Fuel, 
  Wrench, 
  Gauge, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { LoadingSpinner } from '../components/Loading';

const VEHICLE_TYPES = ['Car', 'Bike', 'Truck', 'Other'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'CNG', 'Hybrid', 'Other'];

export default function Vehicles({ 
  vehicles = [], 
  loading, 
  onAddVehicle, 
  onUpdateVehicle, 
  onDeleteVehicle, 
  currencySymbol = '₹', 
  distanceUnit = 'km', 
  fuelUnit = 'litres' 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const initialFormData = {
    name: '',
    brand: '',
    model: '',
    registration_number: '',
    vehicle_type: 'Car',
    fuel_type: 'Petrol',
    manufacturing_year: new Date().getFullYear(),
  };
  const [formData, setFormData] = useState(initialFormData);

  const openAddModal = () => {
    setEditingVehicle(null);
    setFormData(initialFormData);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      name: vehicle.name,
      brand: vehicle.brand,
      model: vehicle.model,
      registration_number: vehicle.registration_number,
      vehicle_type: vehicle.vehicle_type,
      fuel_type: vehicle.fuel_type,
      manufacturing_year: vehicle.manufacturing_year,
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (!formData.name.trim() || !formData.brand.trim() || !formData.model.trim() || !formData.registration_number.trim()) {
        throw new Error('Please fill in all required fields.');
      }
      const year = parseInt(formData.manufacturing_year, 10);
      if (isNaN(year) || year < 1900 || year > 2100) {
        throw new Error('Please enter a valid manufacturing year between 1900 and 2100.');
      }

      if (editingVehicle) {
        await onUpdateVehicle(editingVehicle.id, {
          ...formData,
          manufacturing_year: year,
        });
      } else {
        await onAddVehicle({
          ...formData,
          manufacturing_year: year,
        });
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
      await onDeleteVehicle(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      alert(err.message || 'Failed to delete vehicle.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            My Vehicles
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Register and manage your fleet. Click on any vehicle to view its logs.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          Add Vehicle
        </button>
      </div>

      {/* Loading & Vehicle Grid */}
      {loading ? (
        <LoadingSpinner text="Loading vehicle fleet..." />
      ) : vehicles.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto mb-4">
            <Car className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No Vehicles Registered Yet</h3>
          <p className="text-sm text-slate-400 mt-2 mb-6">
            Add your car, bike, or commercial vehicle to start tracking fuel, mileage and maintenance.
          </p>
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30"
          >
            Add Your First Vehicle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="glass-card rounded-2xl p-6 border flex flex-col justify-between transition-all duration-300 group"
            >
              <div>
                {/* Top badges & actions */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-950/80 text-blue-400 border border-blue-500/30">
                      {v.vehicle_type}
                    </span>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                      {v.fuel_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100">
                    <button
                      onClick={() => openEditModal(v)}
                      className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800/80 rounded-lg transition-colors"
                      title="Edit Vehicle"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(v)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors"
                      title="Delete Vehicle"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Name & Plate */}
                <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                  {v.name}
                </h3>
                <p className="text-xs font-mono font-semibold text-blue-300 mt-1 uppercase tracking-wider">
                  {v.registration_number}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {v.brand} {v.model} • Year {v.manufacturing_year}
                </p>

                {/* Telemetry Stats */}
                <div className="grid grid-cols-2 gap-2 mt-5 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Odometer</span>
                    <span className="font-bold text-white font-mono">
                      {v.latest_odometer ? `${v.latest_odometer.toLocaleString()} ${distanceUnit}` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Avg Mileage</span>
                    <span className="font-bold text-emerald-400">
                      {v.calculated_avg_mileage ? `${v.calculated_avg_mileage} ${distanceUnit}/${fuelUnit}` : 'Calculating...'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Expenses Footer */}
              <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Fuel className="w-3.5 h-3.5 text-blue-400" />
                  {currencySymbol}{(v.total_fuel_spent || 0).toLocaleString('en-IN')}
                </span>
                <span className="flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5 text-amber-400" />
                  {currencySymbol}{(v.total_service_spent || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Vehicle Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingVehicle ? 'Edit Vehicle Details' : 'Register New Vehicle'}
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
              Vehicle Friendly Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Daily Commuter Swift"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Brand / Make *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Hyundai, Honda, TVS"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Model *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Creta SX, Activa 6G"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Registration Number (License Plate) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. MH 12 AB 1234 or DL 03 CA 9988"
              value={formData.registration_number}
              onChange={(e) => setFormData({ ...formData, registration_number: e.target.value.toUpperCase() })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Vehicle Type
              </label>
              <select
                value={formData.vehicle_type}
                onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Fuel Type
              </label>
              <select
                value={formData.fuel_type}
                onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {FUEL_TYPES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Mfg Year *
              </label>
              <input
                type="number"
                min="1950"
                max="2099"
                required
                value={formData.manufacturing_year}
                onChange={(e) => setFormData({ ...formData, manufacturing_year: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
              {isSubmitting ? 'Saving...' : editingVehicle ? 'Update Vehicle' : 'Register Vehicle'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Vehicle"
        message={`Are you sure you want to delete vehicle '${deleteTarget?.name}' (${deleteTarget?.registration_number})? All associated fuel entries, service records, and mileage logs will also be permanently removed.`}
        confirmText="Confirm Delete"
        isDeleting={isSubmitting}
      />
    </div>
  );
}
