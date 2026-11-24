import crypto from 'node:crypto';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import type { DocumentExtractionResponse } from '@betul/ai-contracts';
import { env } from '../config/env.js';
import { store } from '../data/store.js';
import { requireAuth, requireRoles, type AuthenticatedRequest } from '../middleware/auth.js';
import { detectPromptInjection } from '../services/aiOrchestrator.js';

export const documentsRouter = Router();

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.xlsx', '.csv', '.jpg', '.jpeg', '.png', '.txt', '.wav', '.mp3']);
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
  'image/jpeg',
  'image/png',
  'audio/wav',
  'audio/mpeg',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB strict limit
});

documentsRouter.get('/', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const visible = store.documents.filter((doc) => {
    if (user.role === 'district_admin') return true;
    if (doc.uploadedBy === user.id) return true;
    if (doc.departmentId && user.departmentIds.includes(doc.departmentId)) return true;
    return false;
  });
  res.json({ documents: visible });
});

function hasValidMagicBytes(ext: string, buf: Buffer): boolean {
  if (buf.length === 0) return false;
  switch (ext) {
    case '.pdf':
      return buf.subarray(0, 4).toString('ascii') === '%PDF';
    case '.png':
      return (
        buf.length >= 8 &&
        buf[0] === 0x89 &&
        buf[1] === 0x50 &&
        buf[2] === 0x4e &&
        buf[3] === 0x47
      );
    case '.jpg':
    case '.jpeg':
      return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    case '.docx':
    case '.xlsx':
      // Office Open XML files are ZIP archives (PK\x03\x04)
      return buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;
    case '.wav':
      return buf.length >= 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF';
    case '.mp3':
      return (
        (buf.length >= 3 && buf.subarray(0, 3).toString('ascii') === 'ID3') ||
        (buf.length >= 2 && buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0)
      );
    case '.csv':
    case '.txt':
      // Reject obvious binary executables (MZ / ELF) disguised as text/CSV
      return !(buf[0] === 0x4d && buf[1] === 0x5a) && !(buf[0] === 0x7f && buf[1] === 0x45);
    default:
      return false;
  }
}

documentsRouter.post('/upload', requireAuth, upload.single('file'), async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'Please attach a file to upload.' });
    return;
  }

  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(file.mimetype)) {
    res.status(400).json({
      error: `Unsupported file format (${file.mimetype}). Allowed: PDF, DOCX, XLSX, CSV, JPG, PNG, TXT, WAV, MP3.`,
    });
    return;
  }

  if (!hasValidMagicBytes(ext, file.buffer)) {
    store.addAudit({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'document_upload_rejected_magic_bytes',
      resourceType: 'document',
      resourceId: file.originalname,
      outcome: 'denied',
      details: { ext, mimeType: file.mimetype },
    });
    res.status(400).json({
      error: `File content does not match its declared ${ext} format. Upload rejected for security.`,
    });
    return;
  }

  const sha256Hash = crypto.createHash('sha256').update(file.buffer).digest('hex');

  // Edge case (Section 19): Duplicate document upload detection
  const duplicate = store.documents.find((d) => d.sha256Hash === sha256Hash);
  if (duplicate) {
    res.status(409).json({
      error: `Duplicate document detected. This exact file was already uploaded as "${duplicate.originalFilename}".`,
      existingDocumentId: duplicate.id,
    });
    return;
  }

  let extraction: DocumentExtractionResponse | null = null;

  // Try Python FastAPI Document Extraction Service first
  try {
    const form = new FormData();
    const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
    form.append('file', blob, file.originalname);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const resp = await fetch(`${env.aiServiceUrl}/api/v1/documents/extract`, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (resp.ok) {
      extraction = (await resp.json()) as DocumentExtractionResponse;
    }
  } catch {
    // Graceful local extraction fallback below
  }

  if (!extraction) {
    const isTextLike = file.mimetype === 'text/plain' || file.mimetype === 'text/csv';
    const rawText = isTextLike
      ? file.buffer.toString('utf8').slice(0, 8000)
      : `Binary document "${file.originalname}" (${file.mimetype}, ${file.size} bytes). Python OCR service offline — queued for OCR extraction.`;
    const injectionFlag = detectPromptInjection(rawText);
    const warnings: string[] = [
      'OCR / extracted fields are unverified and require authorized human review before entering official records.',
    ];
    if (injectionFlag) {
      warnings.push('SECURITY WARNING: Suspicious prompt-injection pattern detected in document text; content isolated.');
    }
    extraction = {
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      sha256Hash,
      category: ext === '.csv' || ext === '.xlsx' ? 'tabular_dataset' : 'official_document',
      languageDetected: /[\u0900-\u097F]/.test(rawText) ? 'hi' : 'en',
      extractedText: rawText,
      extractedFields: {
        filename: file.originalname,
        detectedLines: rawText.split('\n').length,
      },
      extractionConfidence: isTextLike ? 0.92 : 0.65,
      warnings,
      promptInjectionDetected: injectionFlag,
    };
  }

  const doc = {
    id: `doc-${crypto.randomUUID().slice(0, 8)}`,
    uploadedBy: user.id,
    departmentId: typeof req.body?.departmentId === 'string' && req.body.departmentId ? req.body.departmentId : undefined,
    villageId: typeof req.body?.villageId === 'string' && req.body.villageId ? req.body.villageId : undefined,
    originalFilename: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    sha256Hash,
    category: extraction.category,
    languageDetected: extraction.languageDetected,
    extractedText: extraction.extractedText,
    extractedFields: extraction.extractedFields,
    extractionConfidence: extraction.extractionConfidence,
    processingStatus: 'pending_review' as const,
    verificationStatus: 'pending_review' as const,
    warnings: extraction.warnings,
    createdAt: new Date().toISOString(),
  };

  store.documents.unshift(doc);
  store.addAudit({
    actorUserId: user.id,
    actorRole: user.role,
    action: 'document_uploaded',
    resourceType: 'document',
    resourceId: doc.id,
    outcome: 'success',
    details: { filename: doc.originalFilename, hash: sha256Hash.slice(0, 12), warnings: doc.warnings.length },
  });

  res.status(201).json({ document: doc });
});

const verifyDocSchema = z.object({
  decision: z.enum(['verified', 'rejected']),
  notes: z.string().max(1000).optional(),
});

documentsRouter.patch(
  '/:docId/verify',
  requireAuth,
  requireRoles('district_admin', 'department_head', 'department_officer', 'data_verification_officer'),
  (req: AuthenticatedRequest, res) => {
    const parsed = verifyDocSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid verification payload' });
      return;
    }

    const doc = store.documents.find((d) => d.id === req.params.docId);
    if (!doc) {
      res.status(404).json({ error: 'Document not found.' });
      return;
    }

    doc.verificationStatus = parsed.data.decision;
    doc.processingStatus = parsed.data.decision;
    doc.verifierId = req.user!.id;
    doc.verifierNotes = parsed.data.notes;

    store.addAudit({
      actorUserId: req.user!.id,
      actorRole: req.user!.role,
      action: `document_${parsed.data.decision}`,
      resourceType: 'document',
      resourceId: doc.id,
      outcome: 'success',
      details: { notes: parsed.data.notes },
    });

    res.json({ document: doc });
  },
);
