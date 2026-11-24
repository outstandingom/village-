import crypto from 'node:crypto';
import { Router } from 'express';
import { submitDataRecordSchema, verifyRecordSchema } from '@betul/validation';
import { store } from '../data/store.js';
import {
  canAccessDepartment,
  canAccessVillage,
  requireAuth,
  requireRoles,
  type AuthenticatedRequest,
} from '../middleware/auth.js';

export const recordsRouter = Router();

// Citizens are strictly denied access to internal administrative data records!
recordsRouter.get(
  '/',
  requireAuth,
  requireRoles(
    'district_admin',
    'department_head',
    'department_officer',
    'block_officer',
    'tehsil_officer',
    'data_verification_officer',
    'village_coordinator',
    'field_employee',
  ),
  (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const { departmentId, villageId, status } = req.query;

    const visible = store.records.filter((r) => {
      if (!canAccessDepartment(user, r.departmentId)) return false;
      if (!canAccessVillage(user, r.villageId)) return false;
      if (departmentId && r.departmentId !== departmentId) return false;
      if (villageId && r.villageId !== villageId) return false;
      if (status && r.status !== status) return false;
      return true;
    });

    res.json({ records: visible });
  },
);

recordsRouter.post(
  '/',
  requireAuth,
  requireRoles(
    'district_admin',
    'department_head',
    'department_officer',
    'village_coordinator',
    'field_employee',
  ),
  (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const parsed = submitDataRecordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid record submission', details: parsed.error.flatten() });
      return;
    }

    const d = parsed.data;

    // Enforce strict village & department assignment isolation
    if (!canAccessVillage(user, d.villageId)) {
      store.addAudit({
        actorUserId: user.id,
        actorRole: user.role,
        action: 'record_submit_denied_village',
        resourceType: 'village',
        resourceId: d.villageId,
        outcome: 'denied',
        details: { assignedVillages: user.assignedVillageIds },
      });
      res.status(403).json({
        error: 'Access denied: You are not assigned to collect data for this village.',
      });
      return;
    }

    if (!canAccessDepartment(user, d.departmentId)) {
      store.addAudit({
        actorUserId: user.id,
        actorRole: user.role,
        action: 'record_submit_denied_department',
        resourceType: 'department',
        resourceId: d.departmentId,
        outcome: 'denied',
        details: { assignedDepartments: user.departmentIds },
      });
      res.status(403).json({
        error: 'Access denied: You are not authorized to submit records for this department.',
      });
      return;
    }

    const schema = store.schemas.find((s) => s.id === d.schemaId && s.departmentId === d.departmentId);
    if (!schema) {
      res.status(400).json({ error: 'Data schema not found for the selected department.' });
      return;
    }

    // Validate required fields against the versioned schema
    const missingRequired = schema.fields
      .filter((f) => f.required)
      .filter((f) => {
        const val = d.payload[f.key];
        return val === undefined || val === null || val === '';
      })
      .map((f) => f.labelEn);

    if (missingRequired.length > 0) {
      res.status(400).json({
        error: `Missing required form fields: ${missingRequired.join(', ')}`,
      });
      return;
    }

    const now = new Date().toISOString();
    const record = {
      id: `rec-${crypto.randomUUID().slice(0, 8)}`,
      departmentId: d.departmentId,
      villageId: d.villageId,
      schemaId: schema.id,
      schemaVersion: schema.version,
      submittedBy: user.id,
      submittedByName: user.fullName,
      source: d.source,
      referenceDate: d.referenceDate,
      payload: d.payload,
      status: d.submitNow ? ('submitted' as const) : ('draft' as const),
      version: 1,
      isDemoData: false,
      createdAt: now,
      updatedAt: now,
    };

    store.records.unshift(record);
    store.addAudit({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'data_record_created',
      resourceType: 'data_record',
      resourceId: record.id,
      outcome: 'success',
      details: { departmentId: record.departmentId, villageId: record.villageId, status: record.status },
    });

    res.status(201).json({ record });
  },
);

recordsRouter.patch(
  '/:recordId/verify',
  requireAuth,
  requireRoles('district_admin', 'department_head', 'department_officer', 'data_verification_officer'),
  (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const parsed = verifyRecordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid verification decision', details: parsed.error.flatten() });
      return;
    }

    const record = store.records.find((r) => r.id === req.params.recordId);
    if (!record) {
      res.status(404).json({ error: 'Record not found.' });
      return;
    }

    if (!canAccessDepartment(user, record.departmentId)) {
      res.status(403).json({ error: 'You cannot verify records belonging to another department.' });
      return;
    }

    const prevStatus = record.status;
    record.status = parsed.data.decision;
    record.verifierId = user.id;
    record.verifierNotes = parsed.data.notes;
    record.updatedAt = new Date().toISOString();

    store.addAudit({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'data_record_verified',
      resourceType: 'data_record',
      resourceId: record.id,
      outcome: 'success',
      details: { previousStatus: prevStatus, newStatus: record.status, notes: parsed.data.notes },
    });

    res.json({ record });
  },
);
