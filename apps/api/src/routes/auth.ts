import crypto from 'node:crypto';
import { Router } from 'express';
import { registerUserSchema } from '@betul/validation';
import { BETUL_DISTRICT_ID, hashPassword, store, verifyPassword } from '../data/store.js';
import { issueSessionToken, requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/register', (req, res) => {
  const parsed = registerUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const data = parsed.data;
  const emailLower = data.email.trim().toLowerCase();

  if (store.users.some((u) => u.email.toLowerCase() === emailLower)) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  // Edge case (Section 19): Two users registering with the same phone number
  if (data.phone && store.users.some((u) => u.phone && u.phone === data.phone)) {
    res.status(409).json({
      error: 'This mobile number is already registered to another account. Please sign in or contact support.',
    });
    return;
  }

  const now = new Date().toISOString();
  const isCitizen = data.track === 'citizen';

  // SECURITY RULE (Section 4): Never grant privileged government roles on self-registration!
  const newUser = {
    id: `user-${crypto.randomUUID().slice(0, 8)}`,
    email: emailLower,
    fullName: data.fullName.trim(),
    phone: data.phone || undefined,
    track: data.track,
    role: 'citizen' as const, // Upgraded only after official District Admin verification
    requestedDesignation: isCitizen ? undefined : data.requestedDesignation ?? 'Government Officer',
    verificationStatus: isCitizen ? ('approved' as const) : ('pending_verification' as const),
    districtId: BETUL_DISTRICT_ID,
    departmentIds: [],
    assignedVillageIds: data.villageId ? [data.villageId] : [],
    preferredLanguage: data.preferredLanguage,
    passwordHash: hashPassword(data.password),
    createdAt: now,
    updatedAt: now,
  };

  store.users.push(newUser);
  store.addAudit({
    actorUserId: newUser.id,
    actorRole: newUser.role,
    action: 'user_registered',
    resourceType: 'user_profile',
    resourceId: newUser.id,
    outcome: 'success',
    details: { track: data.track, verificationStatus: newUser.verificationStatus },
  });

  const publicUser = store.toPublicUser(newUser);
  const token = issueSessionToken(publicUser);

  res.status(201).json({
    token,
    user: publicUser,
    message: isCitizen
      ? 'Citizen account created successfully.'
      : 'Registration submitted. Your government/field account is pending official District Administration verification.',
  });
});

authRouter.post('/login', (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');

  const user = store.users.find((u) => u.email.toLowerCase() === email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  if (user.verificationStatus === 'suspended' || user.verificationStatus === 'revoked') {
    res.status(403).json({ error: 'Your account has been suspended or revoked by District Administration.' });
    return;
  }

  const publicUser = store.toPublicUser(user);
  const token = issueSessionToken(publicUser);

  store.addAudit({
    actorUserId: user.id,
    actorRole: user.role,
    action: 'user_login',
    resourceType: 'session',
    resourceId: user.id,
    outcome: 'success',
    details: { role: user.role },
  });

  res.json({ token, user: publicUser });
});

authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});
