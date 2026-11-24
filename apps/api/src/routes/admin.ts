import { Router } from 'express';
import { z } from 'zod';
import { store } from '../data/store.js';
import { requireAuth, requireRoles, type AuthenticatedRequest } from '../middleware/auth.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRoles('district_admin'));

adminRouter.get('/users', (_req, res) => {
  res.json({ users: store.users.map((u) => store.toPublicUser(u)) });
});

const verifyUserSchema = z.object({
  verificationStatus: z.enum(['approved', 'rejected', 'suspended', 'revoked']),
  role: z
    .enum([
      'district_admin',
      'department_head',
      'department_officer',
      'block_officer',
      'tehsil_officer',
      'village_coordinator',
      'field_employee',
      'data_verification_officer',
      'citizen',
    ])
    .optional(),
  departmentIds: z.array(z.string()).optional(),
  assignedVillageIds: z.array(z.string()).optional(),
});

adminRouter.patch('/users/:userId/verify', (req: AuthenticatedRequest, res) => {
  const parsed = verifyUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid verification payload', details: parsed.error.flatten() });
    return;
  }

  const target = store.users.find((u) => u.id === req.params.userId);
  if (!target) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  target.verificationStatus = parsed.data.verificationStatus;
  if (parsed.data.role) target.role = parsed.data.role;
  if (parsed.data.departmentIds) target.departmentIds = parsed.data.departmentIds;
  if (parsed.data.assignedVillageIds) target.assignedVillageIds = parsed.data.assignedVillageIds;
  target.updatedAt = new Date().toISOString();

  store.addAudit({
    actorUserId: req.user!.id,
    actorRole: req.user!.role,
    action: `user_${parsed.data.verificationStatus}`,
    resourceType: 'user_profile',
    resourceId: target.id,
    outcome: 'success',
    details: {
      newRole: target.role,
      departments: target.departmentIds,
      villages: target.assignedVillageIds,
    },
  });

  res.json({ user: store.toPublicUser(target) });
});

adminRouter.get('/audit-logs', (_req, res) => {
  res.json({ logs: store.auditLogs });
});
