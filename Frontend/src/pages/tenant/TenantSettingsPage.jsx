import { useState } from 'react';
import { Shield, KeyRound, Mail, Eye, EyeOff, CheckCircle2, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import OTPInput from '../../components/OTPInput';
import { motion, AnimatePresence } from 'framer-motion';

export default function TenantSettingsPage() {
  const [step, setStep] = useState('email'); // 'email' | 'otp' | 'new_password' | 'success'
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  const extractErrorMessage = (result, defaultMsg) => {
    if (!result) return defaultMsg;
    const msg = result.message || result.detail || result.error;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg) && msg.length > 0 && msg[0].msg) return msg[0].msg;
    if (typeof msg === 'object') return JSON.stringify(msg);
    return defaultMsg;
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    const emailValue = e.target.email.value;
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/tenant/forget_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: emailValue }),
      });
      let result;
      try { result = await response.json(); } catch {
        toast.error(`Server returned invalid JSON (HTTP ${response.status})`); return;
      }
      if (response.ok && (result.status === 'success' || !result.status)) {
        if (result.message) toast.success(result.message);
        setEmail(emailValue);
        setStep('otp');
      } else {
        toast.error(extractErrorMessage(result, 'Failed to send reset email. Verify your email is correct.'));
      }
    } catch { toast.error('Network error. Please try again later.'); }
    finally { setLoading(false); }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { toast.error('Please enter a valid 6-digit OTP'); return; }
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/tenant/verify_otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, otp }),
      });
      let result;
      try { result = await response.json(); } catch {
        toast.error(`Server returned invalid JSON (HTTP ${response.status})`); return;
      }
      if (response.ok && (result.status === 'success' || !result.status)) {
        if (result.message) toast.success(result.message);
        setStep('new_password');
      } else {
        toast.error(extractErrorMessage(result, 'Failed to verify OTP'));
      }
    } catch { toast.error('Network error. Please try again later.'); }
    finally { setLoading(false); }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/tenant/change_password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      });
      let result;
      try { result = await response.json(); } catch {
        toast.error(`Server returned invalid JSON (HTTP ${response.status})`); return;
      }
      if (response.ok && (result.status === 'success' || !result.status)) {
        if (result.message) toast.success(result.message);
        setStep('success');
      } else {
        toast.error(extractErrorMessage(result, 'Failed to change password'));
      }
    } catch { toast.error('Network error. Please try again later.'); }
    finally { setLoading(false); }
  };

  const stepVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit:    { opacity: 0, y: -8 },
  };

  return (
    <div className="max-w-6xl mx-auto p-6">

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account credentials and security preferences.</p>
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex flex-col md:flex-row gap-8">

        {/* Left Sidebar (Narrow) */}
        <div className="w-full md:w-1/4 shrink-0">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Security
          </div>
          <nav>
            <button className="w-full text-left flex items-center gap-2.5 bg-blue-50 text-blue-700 font-medium rounded-md p-3 transition-colors">
              <Shield className="w-4 h-4 text-blue-600 shrink-0" />
              Change Password
            </button>
          </nav>
        </div>

        {/* Right Content Area (Wide, White Card) */}
        <div className="w-full md:w-3/4 bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <AnimatePresence mode="wait">

            {/* ── Step: Verify Email ── */}
            {step === 'email' && (
              <motion.div
                key="email"
                variants={stepVariants}
                initial="initial" animate="animate" exit="exit"
                transition={{ duration: 0.2 }}
              >
                <div className="flex justify-center mb-5">
                  <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <Mail className="w-6 h-6" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-center text-gray-900 mb-2">Verify Identity</h2>
                <p className="text-center text-gray-500 text-sm mb-6">
                  We'll send a one-time verification code to your registered email address.
                </p>

                <div className="max-w-md mx-auto">
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Mail className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                          name="email"
                          type="email"
                          required
                          placeholder="tenant@example.com"
                          className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center items-center py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150"
                    >
                      {loading ? 'Sending Code…' : 'Send Verification Code'}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* ── Step: OTP ── */}
            {step === 'otp' && (
              <motion.div
                key="otp"
                variants={stepVariants}
                initial="initial" animate="animate" exit="exit"
                transition={{ duration: 0.2 }}
              >
                <div className="flex justify-center mb-5">
                  <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <Shield className="w-6 h-6" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-center text-gray-900 mb-2">Enter Security Code</h2>
                <p className="text-center text-gray-500 text-sm mb-6">
                  A 6-digit code was sent to <span className="font-semibold text-gray-800">{email}</span>
                </p>

                <div className="max-w-md mx-auto">
                  <form onSubmit={handleOtpSubmit} className="space-y-4">
                    <div className="flex justify-center py-2">
                      <OTPInput length={6} value={otp} onChange={setOtp} />
                    </div>
                    <button
                      type="submit"
                      disabled={loading || otp.length !== 6}
                      className="w-full flex justify-center items-center py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150"
                    >
                      {loading ? 'Verifying…' : 'Verify Code'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep('email')}
                      className="w-full text-sm text-gray-400 hover:text-gray-700 font-medium transition-colors"
                    >
                      ← Use a different email
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* ── Step: New Password ── */}
            {step === 'new_password' && (
              <motion.div
                key="new_password"
                variants={stepVariants}
                initial="initial" animate="animate" exit="exit"
                transition={{ duration: 0.2 }}
              >
                <div className="flex justify-center mb-5">
                  <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <KeyRound className="w-6 h-6" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-center text-gray-900 mb-2">Set New Password</h2>
                <p className="text-center text-gray-500 text-sm mb-6">
                  Choose a strong password to secure your account.
                </p>

                <div className="max-w-md mx-auto">
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    {/* New password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Lock className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={8}
                          placeholder="••••••••"
                          className="block w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="mt-1.5 text-xs text-gray-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Must be at least 8 characters
                      </p>
                    </div>

                    {/* Confirm password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Lock className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          minLength={8}
                          placeholder="••••••••"
                          className="block w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center items-center py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150"
                    >
                      {loading ? 'Updating…' : 'Update Password'}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* ── Step: Success ── */}
            {step === 'success' && (
              <motion.div
                key="success"
                variants={stepVariants}
                initial="initial" animate="animate" exit="exit"
                transition={{ duration: 0.2 }}
                className="text-center"
              >
                <div className="flex justify-center mb-5">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Password Updated</h2>
                <p className="text-gray-500 text-sm mb-8">Your password has been changed successfully.</p>
                <div className="max-w-md mx-auto">
                  <button
                    onClick={() => { setStep('email'); setEmail(''); setOtp(''); }}
                    className="w-full flex justify-center items-center py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
                  >
                    Return to Security
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
