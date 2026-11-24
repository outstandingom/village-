import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import type { SystemRole, UserProfile } from '@betul/shared-types';
import { env } from '../config/env.js';
import { store } from '../data/store.js';

export interface AuthenticatedRequest extends Request {
  user?: UserProfile;
}

const supabaseAuthClient = createClient(env.supabaseUrl, env.supabasePublishableKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

interface SessionPayload {
  sub: string;
  role: SystemRole;
  exp: number;
}

export function issueSessionToken(user: UserProfile): string {
  const payload: SessionPayload = {
    sub: user.id,
    role: user.role,
    exp: Date.now() + 1000 * 60 * 60 * 12,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', env.sessionSecret).update(body).digest('base64url');
  return `betul.${body}.${sig}`;
}

export function verifyLocalToken(token: string): SessionPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'betul') return null;
  const [, body, sig] = parts;
  const expected = crypto.createHmac('sha256', env.sessionSecret).update(body).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
    if (parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Provide a valid Bearer token.' });
    return;
  }

  const token = header.slice('Bearer '.length).trim();

  // 1. Verify signed local session token
  const local = verifyLocalToken(token);
  if (local) {
    const found = store.users.find((u) => u.id === local.sub);
    if (!found) {
      res.status(401).json({ error: 'Account not found.' });
      return;
    }
    if (found.verificationStatus === 'suspended' || found.verificationStatus === 'revoked') {
      res.status(403).json({ error: 'Your account access has been suspended or revoked.' });
      return;
    }
    req.user = store.toPublicUser(found);
    next();
    return;
  }

  // 2. Fallback: verify Supabase Auth JWT
  try {
    const { data, error } = await supabaseAuthClient.auth.getUser(token);
    if (error || !data.user) {
      res.status(401).json({ error: 'Invalid or expired authentication token.' });
      return;
    }
    const existing = store.users.find((u) => u.email === data.user.email);
    if (existing) {
      req.user = store.toPublicUser(existing);
    } else {
      req.user = {
        id: data.user.id,
        email: data.user.email ?? '',
        fullName: (data.user.user_metadata?.full_name as string) ?? data.user.email ?? 'Citizen',
        track: 'citizen',
        role: 'citizen',
        verificationStatus: 'approved',
        districtId: 'dist-betul-421',
        departmentIds: [],
        assignedVillageIds: [],
        preferredLanguage: 'en',
        createdAt: data.user.created_at,
        updatedAt: data.user.created_at,
      };
    }
    next();
  } catch {
    res.status(401).json({ error: 'Authentication verification failed.' });
  }
}

export function requireRoles(...allowedRoles: SystemRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (user.verificationStatus !== 'approved') {
      store.addAudit({
        actorUserId: user.id,
        actorRole: user.role,
        action: 'access_denied_unverified',
        resourceType: 'route',
        resourceId: req.originalUrl,
        outcome: 'denied',
        details: { verificationStatus: user.verificationStatus },
      });
      res.status(403).json({
        error: 'Account pending official verification. Privileged access is blocked until approved.',
      });
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      store.addAudit({
        actorUserId: user.id,
        actorRole: user.role,
        action: 'access_denied_rbac',
        resourceType: 'route',
        resourceId: req.originalUrl,
        outcome: 'denied',
        details: { required: allowedRoles },
      });
      res.status(403).json({ error: 'You do not have permission to perform this action.' });
      return;
    }
    next();
  };
}

export function canAccessVillage(user: UserProfile, villageId: string): boolean {
  if (user.role === 'district_admin' && user.verificationStatus === 'approved') return true;
  if (user.role === 'citizen') return false;
  return user.assignedVillageIds.includes(villageId);
}

export function canAccessDepartment(user: UserProfile, departmentId: string): boolean {
  if (user.role === 'district_admin' && user.verificationStatus === 'approved') return true;
  if (user.role === 'citizen') return false;
  return user.departmentIds.includes(departmentId);
}
