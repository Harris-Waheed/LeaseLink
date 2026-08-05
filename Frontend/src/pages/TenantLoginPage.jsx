import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Building2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export default function TenantLoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (user) {
    return <Navigate to={user.role === 'tenant' ? '/tenant/dashboard' : '/admin/dashboard'} replace />;
  }

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await login({ email, password });
      toast.success(response.message || 'Successfully logged in!');
      const role = response?.user?.role || response?.data?.user?.role || 'admin';
      navigate(role === 'tenant' ? '/tenant/dashboard' : '/admin/dashboard');
    } catch (err) {
      console.error('Login Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoTenant = () => {
    setEmail('tenant@example.com');
    setPassword('password123');
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-2 gap-4 relative overflow-hidden box-border w-full">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=80" 
          alt="Modern Architecture" 
          className="w-full h-full object-cover opacity-40 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center flex-shrink-0 mb-6">
        <div className="flex justify-center">
          <div className="h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Building2 className="h-6 w-6 text-white" />
          </div>
        </div>
        <h2 className="mt-3 text-center text-2xl font-bold tracking-tight text-white">
          Tenant Portal
        </h2>
        <p className="text-center text-sm text-gray-300">
          Sign in to manage your lease and payments
        </p>
      </div>

      <div className="relative z-10 w-full max-w-md flex-1 mx-auto flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 px-4">
        <div className="bg-white/90 backdrop-blur-xl py-8 px-6 shadow-2xl sm:rounded-2xl sm:px-10 border border-white/20 w-full">
          <form className="space-y-6" onSubmit={handleSignIn}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1 relative">
                <input 
                  type="email"
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all sm:text-sm" 
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all sm:text-sm pr-10" 
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-600/30 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/40 hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {isLoading ? <><Loader2 size={16} className="animate-spin mr-2" /> Signing in...</> : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6 flex flex-col items-center gap-4">
            <button 
              type="button" 
              onClick={fillDemoTenant}
              disabled={isLoading} 
              className="bg-slate-100 text-slate-800 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Use Demo Tenant Account
            </button>
            
            <Link to="/login" className="text-sm font-medium text-gray-500 hover:text-gray-700">
              ← Back to role selection
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
