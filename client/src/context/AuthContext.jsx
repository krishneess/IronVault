import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import { tokenStore } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(() => Boolean(tokenStore.get()));

  // Restore the session from a stored token.
  useEffect(() => {
    if (!tokenStore.get()) return;
    let cancelled = false;
    authService
      .me()
      .then((res) => !cancelled && setUser(res.data.user))
      .catch(() => {
        tokenStore.clear();
        if (!cancelled) setUser(null);
      })
      .finally(() => !cancelled && setInitializing(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  // Any 401 from the API (expired / revoked token) ends the session.
  useEffect(() => {
    const onUnauthorized = (e) => {
      if (!tokenStore.get()) return;
      logout();
      toast.warning('Session ended', e.detail || 'Please log in again.');
    };
    window.addEventListener('ironvault:unauthorized', onUnauthorized);
    return () => window.removeEventListener('ironvault:unauthorized', onUnauthorized);
  }, [logout, toast]);

  const login = useCallback(async (identifier, password) => {
    const res = await authService.login(identifier, password);
    tokenStore.set(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await authService.register(payload);
    tokenStore.set(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await authService.me();
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const value = useMemo(
    () => ({ user, initializing, isAuthenticated: Boolean(user), login, register, logout, refreshUser, setUser }),
    [user, initializing, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
