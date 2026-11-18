import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import FuelTracker from './pages/FuelTracker';
import MileageCalc from './pages/MileageCalc';
import ServiceHistory from './pages/ServiceHistory';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

import { 
  vehicleService, 
  fuelService, 
  serviceRecordService, 
  mileageService, 
  dashboardService, 
  reportsService, 
  settingsService,
  getErrorMessage 
} from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  
  // Data State
  const [vehicles, setVehicles] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [serviceRecords, setServiceRecords] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [mileageSummaries, setMileageSummaries] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [settings, setSettings] = useState(null);

  // Loading & Toast State
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast({ message: '', type: 'info' });
  };

  // Master Data Refresh
  const refreshAllData = useCallback(async (quiet = false) => {
    if (!quiet) setIsRefreshing(true);
    try {
      const [
        vehiclesData,
        statsData,
        fuelData,
        serviceData,
        remindersData,
        mileageData,
        analyticsData,
        settingsData
      ] = await Promise.all([
        vehicleService.getAll(),
        dashboardService.getStats(),
        fuelService.getAll(),
        serviceRecordService.getAll(),
        serviceRecordService.getReminders(),
        mileageService.getAll(),
        reportsService.getAnalytics(),
        settingsService.get(),
      ]);

      setVehicles(vehiclesData || []);
      setDashboardStats(statsData);
      setFuelLogs(fuelData || []);
      setServiceRecords(serviceData || []);
      setReminders(remindersData || []);
      setMileageSummaries(mileageData || []);
      setAnalytics(analyticsData);
      setSettings(settingsData);
    } catch (err) {
      console.error('Data refresh error:', err);
      showToast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refreshAllData(true);
  }, [refreshAllData]);

  // Vehicle Handlers
  const handleAddVehicle = async (data) => {
    try {
      const created = await vehicleService.create(data);
      showToast(`Vehicle '${created.name}' registered successfully!`, 'success');
      await refreshAllData(true);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  };

  const handleUpdateVehicle = async (id, data) => {
    try {
      const updated = await vehicleService.update(id, data);
      showToast(`Vehicle '${updated.name}' updated successfully!`, 'success');
      await refreshAllData(true);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  };

  const handleDeleteVehicle = async (id) => {
    try {
      await vehicleService.delete(id);
      showToast('Vehicle deleted successfully.', 'success');
      if (selectedVehicleId === id) setSelectedVehicleId(null);
      await refreshAllData(true);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  };

  // Fuel Log Handlers
  const handleAddFuelLog = async (data) => {
    try {
      await fuelService.create(data);
      showToast('Fuel refill entry recorded successfully!', 'success');
      await refreshAllData(true);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  };

  const handleUpdateFuelLog = async (id, data) => {
    try {
      await fuelService.update(id, data);
      showToast('Fuel entry updated successfully.', 'success');
      await refreshAllData(true);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  };

  const handleDeleteFuelLog = async (id) => {
    try {
      await fuelService.delete(id);
      showToast('Fuel entry deleted.', 'success');
      await refreshAllData(true);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  };

  // Service Record Handlers
  const handleAddService = async (data) => {
    try {
      await serviceRecordService.create(data);
      showToast('Service record created successfully!', 'success');
      await refreshAllData(true);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  };

  const handleUpdateService = async (id, data) => {
    try {
      await serviceRecordService.update(id, data);
      showToast('Service record updated.', 'success');
      await refreshAllData(true);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  };

  const handleDeleteService = async (id) => {
    try {
      await serviceRecordService.delete(id);
      showToast('Service record deleted.', 'success');
      await refreshAllData(true);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  };

  // Settings Handler
  const handleSaveSettings = async (data) => {
    try {
      const updated = await settingsService.update(data);
      setSettings(updated);
      showToast('Settings saved successfully!', 'success');
      await refreshAllData(true);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  };

  // Handle Quick Navbar Actions
  const handleQuickAction = (action) => {
    if (action === 'add-fuel') {
      setActiveTab('fuel');
    } else if (action === 'add-service') {
      setActiveTab('service');
    }
  };

  const currencySymbol = settings?.currency_symbol || '₹';
  const distanceUnit = settings?.distance_unit || 'km';
  const fuelUnit = settings?.fuel_unit || 'litres';

  return (
    <div className="min-h-screen bg-[#070b14] flex">
      {/* Toast Alerts */}
      <Toast
        type={toast.type}
        message={toast.message}
        onClose={closeToast}
      />

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        reminderCount={reminders.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Top Header Navbar */}
        <Navbar
          onMenuClick={() => setIsSidebarOpen(true)}
          vehicles={vehicles}
          selectedVehicleId={selectedVehicleId}
          setSelectedVehicleId={setSelectedVehicleId}
          onRefresh={() => refreshAllData(false)}
          isRefreshing={isRefreshing}
          onQuickAction={handleQuickAction}
          currencySymbol={currencySymbol}
        />

        {/* Dynamic Page Router */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              stats={dashboardStats}
              loading={loading}
              onNavigate={(tab) => setActiveTab(tab)}
              currencySymbol={currencySymbol}
              distanceUnit={distanceUnit}
              fuelUnit={fuelUnit}
            />
          )}

          {activeTab === 'vehicles' && (
            <Vehicles
              vehicles={vehicles}
              loading={loading}
              onAddVehicle={handleAddVehicle}
              onUpdateVehicle={handleUpdateVehicle}
              onDeleteVehicle={handleDeleteVehicle}
              currencySymbol={currencySymbol}
              distanceUnit={distanceUnit}
              fuelUnit={fuelUnit}
            />
          )}

          {activeTab === 'fuel' && (
            <FuelTracker
              fuelLogs={fuelLogs}
              vehicles={vehicles}
              loading={loading}
              onAddFuelLog={handleAddFuelLog}
              onUpdateFuelLog={handleUpdateFuelLog}
              onDeleteFuelLog={handleDeleteFuelLog}
              selectedVehicleId={selectedVehicleId}
              setSelectedVehicleId={setSelectedVehicleId}
              currencySymbol={currencySymbol}
              distanceUnit={distanceUnit}
              fuelUnit={fuelUnit}
            />
          )}

          {activeTab === 'mileage' && (
            <MileageCalc
              mileageSummaries={mileageSummaries}
              vehicles={vehicles}
              loading={loading}
              selectedVehicleId={selectedVehicleId}
              setSelectedVehicleId={setSelectedVehicleId}
              currencySymbol={currencySymbol}
              distanceUnit={distanceUnit}
              fuelUnit={fuelUnit}
            />
          )}

          {activeTab === 'service' && (
            <ServiceHistory
              serviceRecords={serviceRecords}
              vehicles={vehicles}
              reminders={reminders}
              loading={loading}
              onAddService={handleAddService}
              onUpdateService={handleUpdateService}
              onDeleteService={handleDeleteService}
              selectedVehicleId={selectedVehicleId}
              currencySymbol={currencySymbol}
              distanceUnit={distanceUnit}
              fuelUnit={fuelUnit}
            />
          )}

          {activeTab === 'reports' && (
            <Reports
              analytics={analytics}
              loading={loading}
              currencySymbol={currencySymbol}
              distanceUnit={distanceUnit}
              fuelUnit={fuelUnit}
            />
          )}

          {activeTab === 'settings' && (
            <Settings
              currentSettings={settings}
              onSaveSettings={handleSaveSettings}
              currencySymbol={currencySymbol}
              distanceUnit={distanceUnit}
              fuelUnit={fuelUnit}
            />
          )}
        </main>
      </div>
    </div>
  );
}
