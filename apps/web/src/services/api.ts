import type { UserProfile } from '@betul/shared-types';
import { handleLocalApiFallback } from './localFallback';

const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
const TOKEN_STORAGE_KEY = 'betul_auth_token';
const USER_STORAGE_KEY = 'betul_active_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function getStoredUser(): UserProfile | null {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function setStoredUser(user: UserProfile | null): void {
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

export function shouldUseRemoteApi(): boolean {
  if (!RAW_API_BASE) return false;
  const isBrowserLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const pointsToLocalhost = RAW_API_BASE.includes('localhost') || RAW_API_BASE.includes('127.0.0.1');
  if (!isBrowserLocalhost && pointsToLocalhost) {
    return false;
  }
  return true;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!shouldUseRemoteApi()) {
    return handleLocalApiFallback<T>(path, options, getStoredUser());
  }

  const token = getStoredToken();
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const resp = await fetch(`${RAW_API_BASE}${path}`, {
      ...options,
      headers,
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const msg = typeof data?.error === 'string' ? data.error : `Request failed (${resp.status})`;
      throw new Error(msg);
    }
    return data as T;
  } catch (err) {
    // Only fall back on network errors (e.g. backend API not deployed yet), never on 4xx validation errors
    if (err instanceof TypeError) {
      return handleLocalApiFallback<T>(path, options, getStoredUser());
    }
    throw err;
  }
}
