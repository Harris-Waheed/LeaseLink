import React, { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import SlidingAuth from '../components/SlidingAuth';
import OTPInput from '../components/OTPInput';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Building2, Users } from 'lucide-react';

export default function SlidingAuthPage({ initialMode = 'signin', role = 'admin' }) {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('auth'); // 'auth' or 'otp'
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [signUpData, setSignUpData] = useState(null);

  if (user) {
    return <Navigate to={user.role === 'tenant' ? '/tenant/dashboard' : '/admin/dashboard'} replace />;
  }

  const extractErrorMessage = (result, defaultMsg) => {
    if (!result) return defaultMsg;
    const msg = result.message || result.detail || result.error;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg) && msg.length > 0 && msg[0].msg) return msg[0].msg;
    if (typeof msg === 'object') return JSON.stringify(msg);
    return defaultMsg;
  };

  const handleSignIn = async (username, password) => {
    setIsAuthLoading(true);
    try {
      const response = await login({ email: username, password }, role);
      toast.success(response.message || 'Successfully Login!');
      const resolvedRole = response?.user?.role || response?.data?.user?.role || role;
      navigate(resolvedRole === 'tenant' ? '/tenant/dashboard' : '/admin/dashboard');
    } catch (err) {
      // API interceptor handles the "Not Found" / "401" toasts
      console.error('Login Error:', err);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignUp = async (username, password) => {
    setIsAuthLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/${role}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      let result;
      try {
        result = await response.json();
      } catch (e) {
        toast.error(`Server returned invalid JSON (HTTP ${response.status})`);
        return;
      }

      if (response.ok && (result.status === 'success' || !result.status)) {
        if (result.message) toast.success(result.message);
        setSignUpData({ username, password });
        setStep('otp');
      } else {
        toast.error(extractErrorMessage(result, 'Signup failed'));
      }
    } catch (err) {
      toast.error('Network error during sign up');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/${role}/verify_otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: signUpData.username, otp })
      });
      
      let result;
      try {
        result = await response.json();
      } catch (e) {
        toast.error(`Server returned invalid JSON (HTTP ${response.status})`);
        return;
      }

      if (response.ok && (result.status === 'success' || !result.status)) {
        if (result.message) toast.success(result.message);
        await login({ email: signUpData.username, password: signUpData.password }, role);
        navigate(role === 'tenant' ? '/tenant/dashboard' : '/admin/dashboard');
      } else {
        toast.error(extractErrorMessage(result, 'Failed to verify OTP'));
      }
    } catch (err) {
      toast.error('Failed to verify OTP or network error');
    } finally {
      setLoading(false);
    }
  };

  const isTenant = role === 'tenant';

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

      <div className="relative z-10 w-full max-w-md flex flex-col items-center flex-shrink-0">
        <div className="flex justify-center">
          <div className={`h-10 w-10 ${isTenant ? 'bg-indigo-600 shadow-indigo-600/30' : 'bg-primary-600 shadow-primary-600/30'} rounded-xl flex items-center justify-center shadow-lg`}>
            {isTenant ? <Users className="h-5 w-5 text-white" /> : <Building2 className="h-5 w-5 text-white" />}
          </div>
        </div>
        <h2 className="mt-2 text-center text-xl font-bold tracking-tight text-white">
          LeaseLink {isTenant ? 'Tenant Portal' : ''}
        </h2>
        <p className="text-center text-xs text-gray-300">
          {isTenant ? 'Sign in to manage your lease and payments' : 'Intelligent Property & Tenant Management'}
        </p>
      </div>

      <div className="relative z-10 w-full max-w-4xl flex-1 mx-auto flex flex-col justify-center items-center animate-in fade-in slide-in-from-bottom-4 duration-700 px-4">
        {step === 'auth' ? (
          <>
            <SlidingAuth initialMode={initialMode} isLoading={isAuthLoading} onSignIn={handleSignIn} onSignUp={handleSignUp} role={role} />
            <div className="mt-4 text-center">
              <Link to={`/forgot-password/${role}`} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                Forgot Password?
              </Link>
            </div>
          </>
        ) : (
          <div className="bg-white/90 backdrop-blur-xl py-8 px-6 shadow-2xl sm:rounded-2xl sm:px-12 border border-white/20 w-full max-w-md mx-auto">
            <form className="space-y-6" onSubmit={handleVerifyOtp}>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900">Verify Account</h3>
                <p className="text-sm text-gray-500 mt-2">An OTP has been sent to your email.</p>
              </div>
              
              <div className="mt-1">
                <OTPInput length={6} value={otp} onChange={setOtp} />
              </div>
              
              <div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-primary-600/30 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
              
              <div className="text-center text-sm mt-2">
                <button type="button" onClick={() => setStep('auth')} className="font-medium text-primary-600 hover:text-primary-500">
                  Back to Sign Up
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
