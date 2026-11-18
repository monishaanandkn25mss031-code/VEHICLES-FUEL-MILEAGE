import React, { useState } from 'react';
import { 
  Wrench, 
  Plus, 
  Edit3, 
  Trash2, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  AlertCircle 
} from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { LoadingSpinner } from '../components/Loading';

const COMMON_SERVICE_TYPES = [
  'Periodic Maintenance Service',
  'Engine Oil & Filter Change',
  'Brake Pad Replacement & Inspection',
  'Tyre Rotation & Wheel Alignment',
  'Battery Replacement',
  'Coolant & Fluid Flush',
  'Clutch & Transmission Service',
  'Spark Plug Replacement',
  'AC Filter & Refrigerant Service',
  'General Repairs / Other',
];

export default function ServiceHistory({ 
  serviceRecords = [], 
  vehicles = [], 
  reminders = [], 
  loading, 
  onAddService, 
  onUpdateService, 
  onDeleteService, 
  selectedVehicleId, 
  currencySymbol = '₹', 
  distanceUnit = 'km' 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const initialFormState = {
    vehicle_id: vehicles[0]?.id || '',
    service_date: new Date().toISOString().split('T')[0],
    odometer_reading: '',
    service_type: COMMON_SERVICE_TYPES[0],
    description: '',
    service_centre: '',
    service_cost: '',
    next_service_due_date: '',
    next_service_due_odometer: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  const openAddModal = () => {
    setEditingRecord(null);
    setFormData({
      ...initialFormState,
      vehicle_id: selectedVehicleId || vehicles[0]?.id || '',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (rec) => {
    setEditingRecord(rec);
    setFormData({
      vehicle_id: rec.vehicle_id,
      service_date: rec.service_date,
      odometer_reading: rec.odometer_reading,
      service_type: rec.service_type,
      description: rec.description || '',
      service_centre: rec.service_centre || '',
      service_cost: rec.service_cost,
      next_service_due_date: rec.next_service_due_date || '',
      next_service_due_odometer: rec.next_service_due_odometer || '',
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
      const cost = parseFloat(formData.service_cost);
      if (isNaN(odo) || odo < 0) throw new Error('Odometer reading must be a valid positive number.');
      if (isNaN(cost) || cost < 0) throw new Error('Service cost cannot be negative.');

      let nextOdo = null;
      if (formData.next_service_due_odometer !== '') {
        nextOdo = parseFloat(formData.next_service_due_odometer);
        if (isNaN(nextOdo) || nextOdo < odo) {
          throw new Error('Next service odometer reading cannot be less than current odometer reading.');
        }
      }

      const payload = {
        vehicle_id: formData.vehicle_id,
        service_date: formData.service_date,
        odometer_reading: odo,
        service_type: formData.service_type,
        description: formData.description.trim() || null,
        service_centre: formData.service_centre.trim() || null,
        service_cost: cost,
        next_service_due_date: formData.next_service_due_date || null,
        next_service_due_odometer: nextOdo,
      };

      if (editingRecord) {
        await onUpdateService(editingRecord.id, payload);
      } else {
        await onAddService(payload);
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
      await onDeleteService(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      alert(err.message || 'Failed to delete service record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRecords = selectedVehicleId
    ? serviceRecords.filter((r) => r.vehicle_id === selectedVehicleId)
    : serviceRecords;

  const totalServiceSpent = filteredRecords.reduce((acc, curr) => acc + (parseFloat(curr.service_cost) || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Service & Maintenance Records
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Track garage visits, parts replacement, and automated upcoming maintenance alerts.
          </p>
        </div>
        <button
          onClick={openAddModal}
          disabled={vehicles.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Add Service Record
        </button>
      </div>

      {/* Upcoming Reminders Section */}
      {reminders.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-amber-500">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Upcoming Maintenance Schedules</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reminders.map((r) => {
              const isUrgent = r.urgency === 'urgent';
              return (
                <div
                  key={r.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    isUrgent
                      ? 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                      : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-white">
                        {r.vehicle_name}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full ${
                          isUrgent ? 'bg-rose-500 text-white' : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {r.urgency === 'urgent' ? 'Overdue' : 'Due Soon'}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white mt-1">{r.service_type}</p>
                    <p className="text-xs opacity-90 mt-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      {r.alert_message}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-white/10 text-[11px] opacity-75 flex justify-between">
                    <span>Due Date: {r.next_service_due_date || 'N/A'}</span>
                    <span>Target: {r.next_service_due_odometer ? `${r.next_service_due_odometer} ${distanceUnit}` : 'N/A'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-xl">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total Records</span>
          <p className="text-2xl font-bold text-white mt-1">{filteredRecords.length}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total Maintenance Spend</span>
          <p className="text-2xl font-bold text-amber-400 mt-1">
            {currencySymbol}{totalServiceSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <span className="text-xs text-slate-400 uppercase font-semibold">Active Reminders</span>
          <p className="text-2xl font-bold text-blue-400 mt-1">{reminders.length}</p>
        </div>
      </div>

      {/* Service Records Table */}
      {loading ? (
        <LoadingSpinner text="Fetching service history..." />
      ) : filteredRecords.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl max-w-lg mx-auto">
          <Wrench className="w-12 h-12 text-amber-400 mx-auto mb-3 opacity-80" />
          <h3 className="text-lg font-bold text-white">No Service Records Found</h3>
          <p className="text-sm text-slate-400 mt-1 mb-6">
            Keep track of oil changes, parts replacements, and workshop invoices.
          </p>
          <button
            onClick={openAddModal}
            disabled={vehicles.length === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 disabled:opacity-50"
          >
            {vehicles.length === 0 ? 'Add a Vehicle First' : 'Add First Service Record'}
          </button>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/60 border-b border-slate-700/60">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Service Date</th>
                  <th className="py-3.5 px-4 font-semibold">Vehicle</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Odometer</th>
                  <th className="py-3.5 px-4 font-semibold">Service Type & Notes</th>
                  <th className="py-3.5 px-4 font-semibold">Service Centre</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Cost ({currencySymbol})</th>
                  <th className="py-3.5 px-4 font-semibold">Next Due Target</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-xs font-medium text-slate-300 whitespace-nowrap">
                      {rec.service_date}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                      {rec.vehicle_name}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-200">
                      {rec.odometer_reading.toLocaleString()} {distanceUnit}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white text-xs">{rec.service_type}</p>
                      {rec.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-1">{rec.description}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-300">
                      {rec.service_centre || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-amber-400 font-mono">
                      {currencySymbol}{rec.service_cost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {rec.next_service_due_date ? (
                        <span className="text-slate-300 block">Date: {rec.next_service_due_date}</span>
                      ) : null}
                      {rec.next_service_due_odometer ? (
                        <span className="text-slate-400 block font-mono text-[11px]">
                          At {rec.next_service_due_odometer.toLocaleString()} {distanceUnit}
                        </span>
                      ) : null}
                      {!rec.next_service_due_date && !rec.next_service_due_odometer && (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(rec)}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit Record"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(rec)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Delete Record"
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

      {/* Add / Edit Service Record Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRecord ? 'Edit Service Record' : 'Log Maintenance & Service'}
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
                  {v.name} ({v.registration_number})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Service Date *
              </label>
              <input
                type="date"
                required
                value={formData.service_date}
                onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
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
                placeholder="e.g. 20000"
                value={formData.odometer_reading}
                onChange={(e) => setFormData({ ...formData, odometer_reading: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Service Type *
              </label>
              <input
                type="text"
                list="service-types-list"
                required
                placeholder="e.g. Periodic Maintenance"
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <datalist id="service-types-list">
                {COMMON_SERVICE_TYPES.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Service Cost ({currencySymbol}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="e.g. 4500"
                value={formData.service_cost}
                onChange={(e) => setFormData({ ...formData, service_cost: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Service Centre / Garage Name
            </label>
            <input
              type="text"
              placeholder="e.g. Hyundai Authorized Service Center, Bosch Auto Care"
              value={formData.service_centre}
              onChange={(e) => setFormData({ ...formData, service_centre: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Work Description & Parts Replaced
            </label>
            <textarea
              rows="3"
              placeholder="e.g. Engine oil replaced (5W30), new oil filter, wheel alignment, brake pad cleaning"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Next Due Targets for Automated Reminders */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-blue-500/20 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Next Service Reminder Targets
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Next Due Date
                </label>
                <input
                  type="date"
                  value={formData.next_service_due_date}
                  onChange={(e) => setFormData({ ...formData, next_service_due_date: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Next Due Odometer ({distanceUnit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 30000"
                  value={formData.next_service_due_odometer}
                  onChange={(e) => setFormData({ ...formData, next_service_due_odometer: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              When due date is within 14 days or odometer within 500 {distanceUnit}, high-priority dashboard alerts will trigger.
            </p>
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
              {isSubmitting ? 'Saving...' : editingRecord ? 'Update Record' : 'Save Service Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Service Record"
        message={`Are you sure you want to delete the service record for ${deleteTarget?.vehicle_name} on ${deleteTarget?.service_date} (${currencySymbol}${deleteTarget?.service_cost})?`}
        confirmText="Delete Record"
        isDeleting={isSubmitting}
      />
    </div>
  );
}
