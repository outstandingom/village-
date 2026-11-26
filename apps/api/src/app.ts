import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { store } from './data/store.js';
import { requireAuth, type AuthenticatedRequest } from './middleware/auth.js';
import { authRouter } from './routes/auth.js';
import { adminRouter } from './routes/admin.js';
import { departmentsRouter } from './routes/departments.js';
import { villagesRouter } from './routes/villages.js';
import { recordsRouter } from './routes/records.js';
import { schemesRouter } from './routes/schemes.js';
import { documentsRouter } from './routes/documents.js';
import { assistantRouter } from './routes/assistant.js';
import { logEvent } from './utils/logger.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(compression());
  app.use(
    cors({
      origin: env.corsOrigin.split(',').map((o) => o.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '2mb' }));

  app.use(
    '/api',
    rateLimit({
      windowMs: env.rateLimitWindowMs,
      max: env.rateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests. Please try again shortly.' },
    }),
  );

  app.get('/api/v1/health', async (_req, res) => {
    let pythonService = 'offline';
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1000);
      const r = await fetch(`${env.aiServiceUrl}/health`, { signal: controller.signal });
      clearTimeout(timer);
      if (r.ok) pythonService = 'online';
    } catch {
      pythonService = 'offline';
    }

    res.json({
      status: 'ok',
      service: 'betul-district-api',
      supabaseConfigured: Boolean(env.supabaseUrl && env.supabasePublishableKey),
      supabaseSecretConfigured: Boolean(env.supabaseSecretKey && !env.supabaseSecretKey.includes('replace_with')),
      pythonAiService: pythonService,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/v1/analytics/overview', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const activeSchemes = store.schemes.filter((s) => s.isActive).length;
    const pilotVillages = store.villages.filter((v) => v.isPilotVillage);

    if (user.role === 'citizen') {
      const myApps = store.schemeApplications.filter((a) => a.citizenUserId === user.id);
      res.json({
        roleScope: 'citizen',
        isDemoData: true,
        cards: {
          activeSchemes,
          pilotVillages: pilotVillages.length,
          myApplications: myApps.length,
          departmentsAvailable: store.departments.length,
        },
      });
      return;
    }

    const totalRecords = store.records.length;
    const verifiedRecords = store.records.filter((r) => r.status === 'verified').length;
    const pendingVerification = store.records.filter(
      (r) => r.status === 'submitted' || r.status === 'under_review' || r.status === 'requires_correction',
    ).length;
    const pendingAccounts = store.users.filter((u) => u.verificationStatus === 'pending_verification').length;

    const villageChart = pilotVillages.map((v) => {
      const vRecs = store.records.filter((r) => r.villageId === v.id);
      return {
        village: v.nameEn,
        lgdCode: v.lgdCode,
        verified: vRecs.filter((r) => r.status === 'verified').length,
        pending: vRecs.filter((r) => r.status !== 'verified' && r.status !== 'rejected').length,
      };
    });

    res.json({
      roleScope: user.role,
      isDemoData: true,
      cards: {
        pilotVillages: pilotVillages.length,
        departments: store.departments.length,
        totalRecords,
        verifiedRecords,
        pendingVerification,
        pendingAccounts,
        activeSchemes,
        documentsPendingReview: store.documents.filter((d) => d.verificationStatus === 'pending_review').length,
      },
      villageChart,
    });
  });

  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/departments', departmentsRouter);
  app.use('/api/v1/villages', villagesRouter);
  app.use('/api/v1/records', recordsRouter);
  app.use('/api/v1/schemes', schemesRouter);
  app.use('/api/v1/documents', documentsRouter);
  app.use('/api/v1/assistant', assistantRouter);

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logEvent({ level: 'error', message: err.message });
    res.status(500).json({
      error: 'An unexpected server error occurred. Please try again.',
    });
  });

  return app;
}
