import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
import TenantLayout from './layouts/TenantLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import PropertiesPage from './pages/PropertiesPage';
import TenantsPage from './pages/TenantsPage';
import LeasesPage from './pages/LeasesPage';
import PaymentsPage from './pages/PaymentsPage';
import MaintenancePage from './pages/MaintenancePage';
import SettingsPage from './pages/SettingsPage';
import SlidingAuthPage from './pages/SlidingAuthPage';

import TenantDashboardPage from './pages/tenant/TenantDashboardPage';
import TenantPaymentsPage from './pages/tenant/TenantPaymentsPage';
import TenantMaintenancePage from './pages/tenant/TenantMaintenancePage';
import TenantSettingsPage from './pages/tenant/TenantSettingsPage';
import NetworkStatusBanner from './components/NetworkStatusBanner';

export default function App() {
  return (
    <AuthProvider>
      <NetworkStatusBanner />
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(12px)',
              color: '#f8fafc',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '16px 24px',
              fontSize: '15px',
              fontWeight: '500',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              letterSpacing: '0.2px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
            duration: 4000,
          }}
        />
        <Routes>
          <Route path="/login" element={<Navigate to="/landlord" replace />} />
          <Route path="/landlord" element={<SlidingAuthPage initialMode="signin" role="admin" />} />
          <Route path="/tenant" element={<SlidingAuthPage initialMode="signin" role="tenant" />} />
          
          <Route element={<AuthLayout />}>
            <Route path="/forgot-password/:role" element={<ForgotPasswordPage />} />
          </Route>
          
          <Route path="/admin" element={<MainLayout />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="properties" element={<PropertiesPage />} />
            <Route path="tenants" element={<TenantsPage />} />
            <Route path="leases" element={<LeasesPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="maintenance" element={<MaintenancePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          
          <Route path="/" element={<Navigate to="/landlord" replace />} />


          <Route element={<TenantLayout />}>
            <Route path="/tenant/dashboard" element={<TenantDashboardPage />} />
            <Route path="/tenant/payments" element={<TenantPaymentsPage />} />
            <Route path="/tenant/maintenance" element={<TenantMaintenancePage />} />
            <Route path="/tenant/settings" element={<TenantSettingsPage />} />
          </Route>
          
          {/* Catch-all route for 404s */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </AuthProvider>
  );
}
