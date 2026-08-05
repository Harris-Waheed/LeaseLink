import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './SlidingAuth.css';

export default function SlidingAuth({ initialMode = 'signin', isLoading = false, onSignIn, onSignUp, role = 'admin' }) {
  const [isRightPanelActive, setIsRightPanelActive] = useState(initialMode === 'signup');

  const [showSignInUsername, setShowSignInUsername] = useState(false);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpUsername, setShowSignUpUsername] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignIn = (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;
    
    if (!validateEmail(username)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    if (onSignIn) onSignIn(username, password);
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;
    const confirmPassword = e.target.confirmPassword.value;
    
    if (!validateEmail(username)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (onSignUp) onSignUp(username, password);
  };

  return (
    <div className="sliding-auth-wrapper">
      <div className={`sliding-auth-container ${isRightPanelActive ? 'right-panel-active' : ''}`} id="sliding-auth-container">
        <div className="sliding-auth-form-container sliding-auth-sign-up-container">
          <form className="sliding-auth-form" onSubmit={handleSignUp}>
            <h1>Create Account</h1>
            
            <div className="sliding-input-container">
              <input type={showSignUpUsername ? "text" : "password"} name="username" placeholder="Email Address" maxLength={40} required disabled={isLoading} />
              <button type="button" className="sliding-eye-btn" onClick={() => setShowSignUpUsername(!showSignUpUsername)} disabled={isLoading}>
                {showSignUpUsername ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="sliding-input-container">
              <input type={showSignUpPassword ? "text" : "password"} name="password" placeholder="Password" minLength={8} required disabled={isLoading} />
              <button type="button" className="sliding-eye-btn" onClick={() => setShowSignUpPassword(!showSignUpPassword)} disabled={isLoading}>
                {showSignUpPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="sliding-input-container">
              <input type={showSignUpConfirmPassword ? "text" : "password"} name="confirmPassword" placeholder="Confirm Password" minLength={8} required disabled={isLoading} />
              <button type="button" className="sliding-eye-btn" onClick={() => setShowSignUpConfirmPassword(!showSignUpConfirmPassword)} disabled={isLoading}>
                {showSignUpConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button type="submit" disabled={isLoading} className="flex items-center justify-center gap-2">
              {isLoading ? <><Loader2 size={16} className="animate-spin" /> Please wait...</> : 'Sign Up'}
            </button>
            
            <div className="mobile-toggle">
              <span>Already have an account?</span>
              <button type="button" onClick={() => setIsRightPanelActive(false)}>Sign In</button>
            </div>
          </form>
        </div>
        <div className="sliding-auth-form-container sliding-auth-sign-in-container">
          <form className="sliding-auth-form" onSubmit={handleSignIn}>
            <h1>Sign in</h1>
            
            <div className="sliding-input-container">
              <input type={showSignInUsername ? "text" : "password"} name="username" placeholder="Email Address" maxLength={40} required disabled={isLoading} />
              <button type="button" className="sliding-eye-btn" onClick={() => setShowSignInUsername(!showSignInUsername)} disabled={isLoading}>
                {showSignInUsername ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="sliding-input-container">
              <input type={showSignInPassword ? "text" : "password"} name="password" placeholder="Password" minLength={8} required disabled={isLoading} />
              <button type="button" className="sliding-eye-btn" onClick={() => setShowSignInPassword(!showSignInPassword)} disabled={isLoading}>
                {showSignInPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Link to={`/forgot-password/${role}`} className="forgot-password-link">Forgot your password?</Link>

            <button type="submit" disabled={isLoading} className="flex items-center justify-center gap-2">
              {isLoading ? <><Loader2 size={16} className="animate-spin" /> Please wait...</> : 'Sign In'}
            </button>
            
            <div className="mobile-toggle">
              <span>Don't have an account?</span>
              <button type="button" onClick={() => setIsRightPanelActive(true)}>Sign Up</button>
            </div>
          </form>
        </div>
        <div className="sliding-auth-overlay-container">
          <div className="sliding-auth-overlay">
            <div className="sliding-auth-overlay-panel sliding-auth-overlay-left">
              <h1>Welcome Back!</h1>
              <p>To keep connected with us please login with your personal info</p>
              <button className="ghost" type="button" onClick={() => setIsRightPanelActive(false)}>Sign In</button>
            </div>
            <div className="sliding-auth-overlay-panel sliding-auth-overlay-right">
              <h1>Hello, Friend!</h1>
              <p>Enter your personal details and start your journey with us</p>
              <button className="ghost" type="button" onClick={() => setIsRightPanelActive(true)}>Sign Up</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
