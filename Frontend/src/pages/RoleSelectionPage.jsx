import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Building2, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RoleSelectionPage() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to={user.role === 'tenant' ? '/tenant/dashboard' : '/admin/dashboard'} replace />;
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-2 gap-8 relative overflow-hidden box-border w-full">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=80" 
          alt="Modern Architecture" 
          className="w-full h-full object-cover opacity-40 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-gray-900/40"></div>
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center flex-shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-600/30">
            <Building2 className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-white mb-2">
          Welcome to LeaseLink
        </h2>
        <p className="text-center text-sm text-gray-300 mb-8">
          Choose your account type to continue
        </p>
        
        <div className="grid grid-cols-1 gap-6 w-full max-w-sm">
          <Link 
            to="/landlord"
            className="flex items-center p-6 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-primary-500 rounded-2xl backdrop-blur-md transition-all duration-300 group shadow-xl"
          >
            <div className="h-12 w-12 bg-primary-500/20 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
              <Building2 className="h-6 w-6 text-primary-400 group-hover:text-primary-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-primary-300 transition-colors">I am a Landlord</h3>
              <p className="text-xs text-gray-400 mt-1">Manage properties and leases</p>
            </div>
          </Link>

          <Link 
            to="/tenant"
            className="flex items-center p-6 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-primary-500 rounded-2xl backdrop-blur-md transition-all duration-300 group shadow-xl"
          >
            <div className="h-12 w-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
              <Users className="h-6 w-6 text-indigo-400 group-hover:text-indigo-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">I am a Tenant</h3>
              <p className="text-xs text-gray-400 mt-1">Pay rent and request maintenance</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
