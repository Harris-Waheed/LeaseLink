import { api } from './api';

export const authService = {
  login: async (credentials, role = 'admin') => {
    if (role === 'tenant') {
      const params = new URLSearchParams();
      params.append('username', credentials.email || credentials.username);
      params.append('password', credentials.password);
      return api.post(`/${role}/login`, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
    }

    return api.post(`/${role}/login`, {
      username: credentials.email || credentials.username,
      password: credentials.password
    });
  },
  register: async (userData, role = 'admin') => {
    return api.post(`/${role}/signup`, {
      username: userData.email || userData.username,
      password: userData.password
    });
  },
  logout: async () => {
    return Promise.resolve({ success: true });
  }
};
