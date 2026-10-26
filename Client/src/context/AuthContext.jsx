import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) {
      setInitializing(false);
      return undefined;
    }

    let alive = true;
    api
      .get('/auth/me')
      .then((payload) => {
        if (alive) setUser(payload.user);
      })
      .catch(() => {
        setToken(null);
      })
      .finally(() => {
        if (alive) setInitializing(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const payload = await api.post('/auth/login', { email, password });
    setToken(payload.token);
    setUser(payload.user);
    return payload.user;
  }, []);

  const register = useCallback(async (fullName, email, password) => {
    const payload = await api.post('/auth/register', {
      full_name: fullName,
      email,
      password,
    });
    setToken(payload.token);
    setUser(payload.user);
    return payload.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, initializing, login, register, logout, isAdmin: user?.role === 'admin' }),
    [user, initializing, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
