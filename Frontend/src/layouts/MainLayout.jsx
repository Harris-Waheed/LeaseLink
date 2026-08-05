import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

export default function MainLayout() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/landlord" replace />;
  }

  // Redirect tenants to their portal
  if (user.role === 'tenant') {
    return <Navigate to="/tenant/dashboard" replace />;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50 relative">
      {/* Ambient Animated Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-400/20 blur-[100px] animate-pulse mix-blend-multiply pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 blur-[100px] animate-pulse mix-blend-multiply pointer-events-none" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-sky-400/20 blur-[100px] animate-pulse mix-blend-multiply pointer-events-none" style={{ animationDelay: '4s' }}></div>
      
      <Sidebar />
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
