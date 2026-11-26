import React, { createContext, useContext, useEffect, useState } from 'react';
import type { LanguageCode, RegistrationTrack, SystemRole, UserProfile } from '@betul/shared-types';
import {
  apiRequest,
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
  shouldUseRemoteApi,
} from '../services/api';
import { DEMO_USERS } from '../services/localFallback';
import { supabase } from '../services/supabase';

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

function mapSupabaseUserToProfile(sbUser: {
  id: string;
  email?: string;
  created_at?: string;
  user_metadata?: Record<string, unknown>;
}): UserProfile {
  const meta = sbUser.user_metadata ?? {};
  const track = (meta.track as RegistrationTrack) ?? 'citizen';
  const isCitizen = track === 'citizen';
  return {
    id: sbUser.id,
    email: sbUser.email ?? '',
    fullName: String(meta.full_name ?? sbUser.email ?? 'Betul User'),
    phone: typeof meta.phone === 'string' ? meta.phone : undefined,
    track,
    role: (meta.role as SystemRole) ?? 'citizen',
    requestedDesignation:
      typeof meta.requested_designation === 'string' ? meta.requested_designation : undefined,
    verificationStatus: isCitizen ? 'approved' : 'pending_verification',
    districtId: 'dist-betul-421',
    departmentIds: [],
    assignedVillageIds: ['vil-khedi'],
    preferredLanguage: (meta.preferred_language as LanguageCode) ?? 'en',
    createdAt: sbUser.created_at ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const cachedUser = getStoredUser();
  const [user, setUser] = useState<UserProfile | null>(cachedUser);
  // Render immediately if a cached session exists; revalidate in background
  const [loading, setLoading] = useState(!cachedUser && Boolean(getStoredToken()));
  const [lang, setLang] = useState<LanguageCode>(cachedUser?.preferredLanguage ?? 'en');

  useEffect(() => {
    async function restoreSession() {
      const token = getStoredToken();
      if (!token && !cachedUser) {
        setLoading(false);
        return;
      }

      if (shouldUseRemoteApi() && token) {
        try {
          const res = await apiRequest<{ user: UserProfile }>('/auth/me');
          setStoredUser(res.user);
          setUser(res.user);
          setLang(res.user.preferredLanguage ?? 'en');
          setLoading(false);
          return;
        } catch {
          setStoredToken(null);
          setStoredUser(null);
          setUser(null);
        }
      }

      // Check Supabase Auth session in background
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          const profile = mapSupabaseUserToProfile(data.session.user);
          setStoredToken(data.session.access_token);
          setStoredUser(profile);
          setUser(profile);
          setLang(profile.preferredLanguage ?? 'en');
        }
      } catch {
        // keep cached demo user if offline
      }
      setLoading(false);
    }

    void restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(email: string, password: string): Promise<void> {
    const emailLower = email.trim().toLowerCase();

    // 1. If Express API is reachable locally/remotely, use it
    if (shouldUseRemoteApi()) {
      try {
        const res = await apiRequest<{ token: string; user: UserProfile }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: emailLower, password }),
        });
        setStoredToken(res.token);
        setStoredUser(res.user);
        setUser(res.user);
        setLang(res.user.preferredLanguage ?? 'en');
        return;
      } catch (err) {
        // Fall through to Supabase Auth if API server is unreachable
        if (!(err instanceof TypeError)) {
          throw err;
        }
      }
    }

    // 2. Quick Demo Role Sign-In on static Vercel deployment
    if (DEMO_USERS[emailLower] && password.startsWith('Betul')) {
      const demoProfile = DEMO_USERS[emailLower];
      setStoredToken(`demo-${demoProfile.id}`);
      setStoredUser(demoProfile);
      setUser(demoProfile);
      setLang(demoProfile.preferredLanguage ?? 'en');
      return;
    }

    // 3. Real Supabase Auth sign-in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailLower,
      password,
    });
    if (error) {
      throw new Error(error.message);
    }
    if (!data.user || !data.session) {
      throw new Error('Sign in failed. Please verify your email and password.');
    }

    const profile = mapSupabaseUserToProfile(data.user);
    setStoredToken(data.session.access_token);
    setStoredUser(profile);
    setUser(profile);
    setLang(profile.preferredLanguage ?? 'en');
  }

  async function register(payload: Record<string, unknown>): Promise<string> {
    const email = String(payload.email ?? '').trim().toLowerCase();
    const password = String(payload.password ?? '');
    const fullName = String(payload.fullName ?? '').trim();
    const phone = String(payload.phone ?? '').trim();
    const track = (payload.track as RegistrationTrack) ?? 'citizen';
    const requestedDesignation = payload.requestedDesignation
      ? String(payload.requestedDesignation)
      : undefined;
    const preferredLanguage = (payload.preferredLanguage as LanguageCode) ?? 'en';

    // 1. If Express API is reachable, register through API
    if (shouldUseRemoteApi()) {
      try {
        const res = await apiRequest<{ token: string; user: UserProfile; message: string }>(
          '/auth/register',
          {
            method: 'POST',
            body: JSON.stringify(payload),
          },
        );
        setStoredToken(res.token);
        setStoredUser(res.user);
        setUser(res.user);
        setLang(res.user.preferredLanguage ?? 'en');
        return res.message;
      } catch (err) {
        if (!(err instanceof TypeError)) {
          throw err;
        }
      }
    }

    // 2. Real Supabase Auth Sign Up (works directly on Vercel!)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || undefined,
          track,
          role: 'citizen', // Never self-grant privileged roles!
          requested_designation: requestedDesignation,
          preferred_language: preferredLanguage,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data.session && data.user) {
      const profile = mapSupabaseUserToProfile(data.user);
      setStoredToken(data.session.access_token);
      setStoredUser(profile);
      setUser(profile);
      setLang(profile.preferredLanguage ?? 'en');
      return track === 'citizen'
        ? 'Citizen account created and signed in via Supabase Auth!'
        : 'Account created via Supabase Auth. Your government/field role is pending District Administration verification.';
    }

    return 'Account created in Supabase! Please check your email inbox to confirm your email address, then click Sign In.';
  }

  function logout(): void {
    void supabase.auth.signOut();
    setStoredToken(null);
    setStoredUser(null);
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
