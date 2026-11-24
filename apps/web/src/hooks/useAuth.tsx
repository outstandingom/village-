import React, { createContext, useContext, useEffect, useState } from 'react';
import type { LanguageCode, UserProfile } from '@betul/shared-types';
import { apiRequest, getStoredToken, setStoredToken } from '../services/api';

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: Record<string, unknown>) => Promise<string>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<LanguageCode>('en');

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }
    apiRequest<{ user: UserProfile }>('/auth/me')
      .then((res) => {
        setUser(res.user);
        setLang(res.user.preferredLanguage ?? 'en');
      })
      .catch(() => {
        setStoredToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string): Promise<void> {
    const res = await apiRequest<{ token: string; user: UserProfile }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(res.token);
    setUser(res.user);
    setLang(res.user.preferredLanguage ?? 'en');
  }

  async function register(payload: Record<string, unknown>): Promise<string> {
    const res = await apiRequest<{ token: string; user: UserProfile; message: string }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
    setStoredToken(res.token);
    setUser(res.user);
    setLang(res.user.preferredLanguage ?? 'en');
    return res.message;
  }

  function logout(): void {
    setStoredToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, lang, setLang, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
