import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { citizenProfileSchema } from '@betul/validation';
import { BETUL_DISTRICT_ID, store } from '../data/store.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { evaluateSchemeEligibility, isSchemeCurrentlyActive } from '../services/eligibilityEngine.js';

export const schemesRouter = Router();

schemesRouter.get('/', requireAuth, (req: AuthenticatedRequest, res) => {
  const includeInactive =
    req.query.includeInactive === 'true' && req.user?.role === 'district_admin';
  const category = typeof req.query.category === 'string' ? req.query.category : undefined;
  const search = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : undefined;

  const list = store.schemes.filter((s) => {
    if (!includeInactive && !isSchemeCurrentlyActive(s)) return false;
    if (category && s.departmentCategory.toLowerCase() !== category.toLowerCase()) return false;
    if (search) {
      const hay = `${s.nameEn} ${s.nameHi} ${s.code} ${s.aliases.join(' ')} ${s.summaryEn}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  res.json({ schemes: list });
});

schemesRouter.get('/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  const profile = store.citizenProfiles.get(req.user!.id) ?? null;
  res.json({ profile });
});

schemesRouter.put('/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  const parsed = citizenProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid citizen profile', details: parsed.error.flatten() });
    return;
  }

  const profile = {
    id: store.citizenProfiles.get(req.user!.id)?.id ?? `cit-${crypto.randomUUID().slice(0, 8)}`,
    userId: req.user!.id,
    districtId: BETUL_DISTRICT_ID,
    ...parsed.data,
    updatedAt: new Date().toISOString(),
  };

  store.citizenProfiles.set(req.user!.id, profile);
  const matches = evaluateSchemeEligibility(profile, store.schemes);

  store.addAudit({
    actorUserId: req.user!.id,
    actorRole: req.user!.role,
    action: 'citizen_profile_updated',
    resourceType: 'citizen_profile',
    resourceId: profile.id,
    outcome: 'success',
    details: { matchedCount: matches.filter((m) => m.outcome === 'potentially_eligible').length },
  });

  res.json({ profile, matches });
});

schemesRouter.post('/check-eligibility', requireAuth, (req: AuthenticatedRequest, res) => {
  const incoming = req.body && Object.keys(req.body).length > 0
    ? req.body
    : (store.citizenProfiles.get(req.user!.id) ?? {});
  const matches = evaluateSchemeEligibility(incoming, store.schemes);
  res.json({ matches });
});

schemesRouter.get('/applications', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const apps =
    user.role === 'district_admin' || user.role === 'department_officer' || user.role === 'department_head'
      ? store.schemeApplications
      : store.schemeApplications.filter((a) => a.citizenUserId === user.id);
  res.json({ applications: apps });
});

const applySchema = z.object({
  schemeId: z.string().min(1),
  notes: z.string().max(500).optional(),
});

schemesRouter.post('/applications', requireAuth, (req: AuthenticatedRequest, res) => {
  const parsed = applySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid scheme application payload' });
    return;
  }

  const scheme = store.schemes.find((s) => s.id === parsed.data.schemeId);
  if (!scheme) {
    res.status(404).json({ error: 'Scheme not found.' });
    return;
  }
  if (!isSchemeCurrentlyActive(scheme)) {
    res.status(400).json({ error: 'Cannot apply: This scheme is inactive or expired.' });
    return;
  }

  const existing = store.schemeApplications.find(
    (a) => a.citizenUserId === req.user!.id && a.schemeId === scheme.id,
  );
  if (existing) {
    res.status(409).json({ error: 'You have already submitted an application for this scheme.' });
    return;
  }

  const profile = store.citizenProfiles.get(req.user!.id);
  const application = {
    id: `app-${crypto.randomUUID().slice(0, 8)}`,
    citizenUserId: req.user!.id,
    schemeId: scheme.id,
    schemeName: scheme.nameEn,
    villageId: profile?.villageId ?? req.user!.assignedVillageIds[0],
    status: 'application_submitted' as const,
    submittedAt: new Date().toISOString(),
    notes: parsed.data.notes,
  };

  store.schemeApplications.unshift(application);
  store.addAudit({
    actorUserId: req.user!.id,
    actorRole: req.user!.role,
    action: 'scheme_application_submitted',
    resourceType: 'scheme_application',
    resourceId: application.id,
    outcome: 'success',
    details: { schemeCode: scheme.code },
  });

  res.status(201).json({ application });
});
