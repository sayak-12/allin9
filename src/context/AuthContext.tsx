import React, { useState, useEffect, useRef, useCallback } from 'react';
import api, { authService } from '../services/api';
import { AuthContext } from './AuthContextProvider';

const getJwtPayload = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const normalized = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const decoded = atob(normalized);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const getTokenExpiryEpoch = (token: string) => {
  const payload = getJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return null;
  return payload.exp;
};

const isTokenExpired = (token: string) => {
  const exp = getTokenExpiryEpoch(token);
  if (!exp) return false;
  return Date.now() >= exp * 1000;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialStoredToken = localStorage.getItem('token');
  const initialSafeToken = initialStoredToken && !isTokenExpired(initialStoredToken)
    ? initialStoredToken
    : null;

  const [token, setToken] = useState<string | null>(() => initialSafeToken);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!initialSafeToken);
  const logoutTimerRef = useRef<number | undefined>(undefined);

  const clearLogoutTimer = useCallback(() => {
    if (logoutTimerRef.current) {
      window.clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = undefined;
    }
  }, []);

  const logout = useCallback(() => {
    clearLogoutTimer();
    localStorage.removeItem('token');
    setToken(null);
    setIsAuthenticated(false);
    delete api.defaults.headers.common.Authorization;
  }, [clearLogoutTimer]);

  const scheduleTokenExpiryLogout = useCallback((jwtToken: string) => {
    clearLogoutTimer();

    const exp = getTokenExpiryEpoch(jwtToken);
    if (!exp) {
      return;
    }

    const expiresInMs = exp * 1000 - Date.now();
    if (expiresInMs <= 0) {
      logout();
      return;
    }

    logoutTimerRef.current = window.setTimeout(() => {
      logout();
    }, expiresInMs);
  }, [clearLogoutTimer, logout]);

  // keep axios default header in sync with token
  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      scheduleTokenExpiryLogout(token);
    } else {
      delete api.defaults.headers.common.Authorization;
    }

    return () => {
      clearLogoutTimer();
    };
  }, [token, scheduleTokenExpiryLogout, clearLogoutTimer]);

  useEffect(() => {
    const handleExpiredToken = () => {
      logout();
    };

    window.addEventListener('auth:expired', handleExpiredToken);
    return () => {
      window.removeEventListener('auth:expired', handleExpiredToken);
    };
  }, [logout]);

  const login = useCallback(async (mobileNumber: string, password: string) => {
    try {
      const response = await authService.login(mobileNumber, password);
      const responseData = response.data;
      const payload = Array.isArray(responseData) ? responseData[0] : responseData;
      const jwt = typeof payload === 'string'
        ? payload
        : payload?.token || payload?.jwt || payload?.accessToken;

      if (!jwt) {
        throw new Error('Authentication token missing from login response');
      }

      localStorage.setItem('token', jwt);
      setToken(jwt);
      setIsAuthenticated(true);
    } catch {
      throw new Error('Login failed');
    }
  }, []);

  return (
    <AuthContext.Provider value={{ token, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
