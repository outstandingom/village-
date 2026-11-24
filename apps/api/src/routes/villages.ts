import { Router } from 'express';
import { z } from 'zod';
import { store } from '../data/store.js';
import { requireAuth, requireRoles, type AuthenticatedRequest } from '../middleware/auth.js';

export const villagesRouter = Router();

villagesRouter.get('/', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const pilotOnly = req.query.pilot === 'true';

  const villages = store.villages
    .filter((v) => (!pilotOnly || v.isPilotVillage))
    .map((v) => {
      const records = store.records.filter((r) => r.villageId === v.id);
      const verifiedCount = records.filter((r) => r.status === 'verified').length;
      const pendingCount = records.filter(
        (r) => r.status === 'submitted' || r.status === 'under_review' || r.status === 'requires_correction',
      ).length;

      // Citizens only see public village directory info, never internal verification metrics
      if (user.role === 'citizen') {
        return {
          id: v.id,
          districtId: v.districtId,
          blockName: v.blockName,
          tehsilName: v.tehsilName,
          gramPanchayatName: v.gramPanchayatName,
          nameEn: v.nameEn,
          nameHi: v.nameHi,
          lgdCode: v.lgdCode,
          isPilotVillage: v.isPilotVillage,
          latitude: v.latitude,
          longitude: v.longitude,
          isDemoData: v.isDemoData,
        };
      }

      return {
        ...v,
        metrics: {
          totalRecords: records.length,
          verifiedRecords: verifiedCount,
          pendingRecords: pendingCount,
          completionPercent:
            v.assignedDepartmentIds.length > 0
              ? Math.min(100, Math.round((verifiedCount / v.assignedDepartmentIds.length) * 100))
              : 0,
        },
      };
    });

  res.json({ villages });
});

const assignDeptSchema = z.object({
  assignedDepartmentIds: z.array(z.string()),
  coordinatorUserId: z.string().optional(),
});

villagesRouter.patch(
  '/:villageId/pilot-config',
  requireAuth,
  requireRoles('district_admin'),
  (req: AuthenticatedRequest, res) => {
    const parsed = assignDeptSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid pilot village assignment payload' });
      return;
    }

    const village = store.villages.find((v) => v.id === req.params.villageId);
    if (!village) {
      res.status(404).json({ error: 'Village not found.' });
      return;
    }

    village.assignedDepartmentIds = parsed.data.assignedDepartmentIds;
    if (parsed.data.coordinatorUserId !== undefined) {
      village.coordinatorUserId = parsed.data.coordinatorUserId || undefined;
    }

    store.addAudit({
      actorUserId: req.user!.id,
      actorRole: req.user!.role,
      action: 'pilot_village_updated',
      resourceType: 'village',
      resourceId: village.id,
      outcome: 'success',
      details: {
        assignedDepartmentIds: village.assignedDepartmentIds,
        coordinatorUserId: village.coordinatorUserId,
      },
    });

    res.json({ village });
  },
);
