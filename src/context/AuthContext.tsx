import React, { useState, useEffect } from 'react';
import api, { authService } from '../services/api';
import { AuthContext } from './AuthContextProvider';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialToken = localStorage.getItem('token');
  const [token, setToken] = useState<string | null>(() => initialToken);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!initialToken);

  // keep axios default header in sync with token
  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  }, [token]);

  const login = async (mobileNumber: string, password: string) => {
    try {
      const response = await authService.login(mobileNumber, password);
      const { token } = response.data;
      localStorage.setItem('token', token);
      setToken(token);
      setIsAuthenticated(true);
    } catch {
      throw new Error('Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ token, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
