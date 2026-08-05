import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved user session (simulated)
    const savedUser = localStorage.getItem('leaseLinkUser');
    const token = localStorage.getItem('token');
    const tenantToken = localStorage.getItem('tenant_token');
    
    if (savedUser && (token || tenantToken)) {
      setUser(JSON.parse(savedUser));
    } else {
      localStorage.removeItem('leaseLinkUser');
      setUser(null);
    }
    setLoading(false);
  }, []);

  const login = async (credentials, role = 'admin') => {
    const response = await authService.login(credentials, role);
    const result = response.data;
    const token = result.access_token || result.token || result.data?.token || result.data?.access_token;
    const userData = result.user || result.data?.user || { email: credentials.email || credentials.username, role: role };
    
    if (token) {
      if (role === 'tenant') {
        localStorage.setItem('tenant_token', token);
      } else {
        localStorage.setItem('token', token);
      }
    }
    setUser(userData);
    localStorage.setItem('leaseLinkUser', JSON.stringify(userData));
    return result;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch(e) {
      console.error(e);
    }
    setUser(null);
    localStorage.removeItem('leaseLinkUser');
    localStorage.removeItem('token');
    localStorage.removeItem('tenant_token');
    window.location.href = '/landlord';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
