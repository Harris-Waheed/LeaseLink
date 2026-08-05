import { Outlet, Navigate } from 'react-router-dom';
import TenantSidebar from '../components/TenantSidebar';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

export default function TenantLayout() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/tenant" replace />;
  }

  // Double check that only tenants can see this layout
  if (user.role !== 'tenant') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      <TenantSidebar />
      <div className="flex flex-col w-0 flex-1 overflow-hidden md:pl-64">
        <Header />
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
