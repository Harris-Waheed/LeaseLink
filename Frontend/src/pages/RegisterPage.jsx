import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import OTPInput from '../components/OTPInput';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [otp, setOtp] = useState('');

  const [step, setStep] = useState('register'); // 'register', 'otp'
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const email = data.get('email');
    const password = data.get('password');
    const confirmPassword = data.get('confirmPassword');

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setFormData({ email, password });
    setLoading(true);
    // Simulate API registration / sending OTP
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
      toast.success('OTP sent to your email');
    }, 1000);
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      // Simulate verification and login process
      await login(formData);
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to verify OTP or sign in');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {step === 'register' && (
        <form className="space-y-6" onSubmit={handleRegisterSubmit}>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">Create an Account</h3>
            <p className="text-sm text-gray-500 mt-1">Sign up to get started.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email address</label>
            <div className="mt-1 relative">
              <input 
                type={showEmail ? "email" : "password"} 
                name="email"
                required 
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all sm:text-sm pr-10" 
              />
              <button
                type="button"
                onClick={() => setShowEmail(!showEmail)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showEmail ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="mt-1 relative">
              <input 
                type={showPassword ? "text" : "password"} 
                name="password"
                required 
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all sm:text-sm pr-10" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <div className="mt-1 relative">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                name="confirmPassword"
                required 
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all sm:text-sm pr-10" 
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-primary-600/30 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/40 hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? 'Registering...' : 'Sign up'}
            </button>
          </div>
          <div className="text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </div>
        </form>
      )}

      {step === 'otp' && (
        <form className="space-y-6" onSubmit={handleOtpSubmit}>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">Verify Email</h3>
            <p className="text-sm text-gray-500 mt-1">An OTP has been sent to your email.</p>
          </div>
          <div>
            <div className="mt-1">
              <OTPInput length={6} value={otp} onChange={setOtp} />
            </div>
          </div>
          <div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-primary-600/30 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/40 hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
