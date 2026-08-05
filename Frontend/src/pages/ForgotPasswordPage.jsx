import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import OTPInput from '../components/OTPInput';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { role = 'admin' } = useParams();
  const [step, setStep] = useState('email'); // 'email', 'otp', 'new_password'
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');

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
      const response = await fetch(`http://localhost:8000/${role}/forget_password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: emailValue })
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
        setEmail(emailValue);
        setStep('otp');
      } else {
        toast.error(extractErrorMessage(result, 'Failed to send reset email'));
      }
    } catch (err) {
      toast.error('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
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
        body: JSON.stringify({ username: email, otp })
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
        setStep('new_password');
      } else {
        toast.error(extractErrorMessage(result, 'Failed to verify OTP'));
      }
    } catch (err) {
      toast.error('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/${role}/change_password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password })
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
        navigate(`/${role === 'admin' ? 'landlord' : 'tenant'}`);
      } else {
        toast.error(extractErrorMessage(result, 'Failed to change password'));
      }
    } catch (err) {
      toast.error('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {step === 'email' && (
        <form className="space-y-6" onSubmit={handleEmailSubmit}>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">Reset Password</h3>
            <p className="text-sm text-gray-500 mt-1">Enter your email to receive an OTP.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email address</label>
            <div className="mt-1 relative">
              <input 
                name="email"
                type={showEmail ? "email" : "password"} 
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
            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-primary-600/30 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/40 hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? 'Sending...' : 'Send Email'}
            </button>
          </div>
          <div className="text-center text-sm">
            <Link to={`/${role === 'admin' ? 'landlord' : 'tenant'}`} className="font-medium text-primary-600 hover:text-primary-500">
              Back to login
            </Link>
          </div>
        </form>
      )}

      {step === 'otp' && (
        <form className="space-y-6" onSubmit={handleOtpSubmit}>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">Enter OTP</h3>
            <p className="text-sm text-gray-500 mt-1">We've sent a code to your email.</p>
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

      {step === 'new_password' && (
        <form className="space-y-6" onSubmit={handlePasswordSubmit}>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">Create New Password</h3>
            <p className="text-sm text-gray-500 mt-1">Enter your new secure password.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
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
              {loading ? 'Updating...' : 'Reset Password'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
