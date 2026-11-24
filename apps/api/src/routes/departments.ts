import crypto from 'node:crypto';
import { Router } from 'express';
import { createDepartmentSchema, createSchemaVersionSchema } from '@betul/validation';
import { BETUL_DISTRICT_ID, store } from '../data/store.js';
import { requireAuth, requireRoles, type AuthenticatedRequest } from '../middleware/auth.js';

export const departmentsRouter = Router();

departmentsRouter.get('/', requireAuth, (_req, res) => {
  const enriched = store.departments.map((d) => ({
    ...d,
    schemasCount: store.schemas.filter((s) => s.departmentId === d.id).length,
    recordsCount: store.records.filter((r) => r.departmentId === d.id).length,
  }));
  res.json({ departments: enriched });
});

departmentsRouter.post(
  '/',
  requireAuth,
  requireRoles('district_admin'),
  (req: AuthenticatedRequest, res) => {
    const parsed = createDepartmentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid department payload', details: parsed.error.flatten() });
      return;
    }

    const d = parsed.data;
    // Edge case (Section 19): Duplicate department creation
    if (
      store.departments.some(
        (existing) =>
          existing.code.toUpperCase() === d.code.toUpperCase() ||
          existing.nameEn.toLowerCase() === d.nameEn.toLowerCase(),
      )
    ) {
      res.status(409).json({
        error: `A department with code "${d.code}" or name "${d.nameEn}" already exists.`,
      });
      return;
    }

    const now = new Date().toISOString();
    const headUser = d.headUserId ? store.users.find((u) => u.id === d.headUserId) : undefined;
    const dept = {
      id: `dept-${d.code.toLowerCase()}-${crypto.randomUUID().slice(0, 4)}`,
      districtId: BETUL_DISTRICT_ID,
      code: d.code.toUpperCase(),
      nameEn: d.nameEn,
      nameHi: d.nameHi,
      category: d.category,
      descriptionEn: d.descriptionEn,
      descriptionHi: d.descriptionHi || d.descriptionEn,
      headUserId: headUser?.id,
      headName: headUser?.fullName,
      isActive: true,
      assignedVillageIds: d.assignedVillageIds,
      isDemoData: false,
      createdAt: now,
      updatedAt: now,
    };

    store.departments.push(dept);
    store.addAudit({
      actorUserId: req.user!.id,
      actorRole: req.user!.role,
      action: 'department_created',
      resourceType: 'department',
      resourceId: dept.id,
      outcome: 'success',
      details: { code: dept.code, nameEn: dept.nameEn },
    });

    res.status(201).json({ department: dept });
  },
);

departmentsRouter.get('/:departmentId/schemas', requireAuth, (req, res) => {
  const list = store.schemas.filter((s) => s.departmentId === req.params.departmentId);
  res.json({ schemas: list });
});

departmentsRouter.post(
  '/:departmentId/schemas',
  requireAuth,
  requireRoles('district_admin', 'department_head', 'department_officer'),
  (req: AuthenticatedRequest, res) => {
    const parsed = createSchemaVersionSchema.safeParse({
      ...req.body,
      departmentId: req.params.departmentId,
    });
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid form schema', details: parsed.error.flatten() });
      return;
    }

    const existingVersions = store.schemas.filter(
      (s) => s.departmentId === parsed.data.departmentId && s.schemaName === parsed.data.schemaName,
    );
    const nextVersion = existingVersions.length + 1;

    const schema = {
      id: `schema-${crypto.randomUUID().slice(0, 8)}`,
      departmentId: parsed.data.departmentId,
      schemaName: parsed.data.schemaName,
      version: nextVersion,
      fields: parsed.data.fields,
      isActive: true,
      createdAt: new Date().toISOString(),
      createdBy: req.user!.id,
    };

    store.schemas.push(schema);
    store.addAudit({
      actorUserId: req.user!.id,
      actorRole: req.user!.role,
      action: 'schema_version_created',
      resourceType: 'data_schema_version',
      resourceId: schema.id,
      outcome: 'success',
      details: { departmentId: schema.departmentId, version: nextVersion },
    });

    res.status(201).json({ schema });
  },
);
