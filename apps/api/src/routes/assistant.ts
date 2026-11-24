import { Router } from 'express';
import { aiQuerySchema, voiceNormalizeSchema } from '@betul/validation';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { normalizeVoiceOrText, runAssistantQuery } from '../services/aiOrchestrator.js';

export const assistantRouter = Router();

assistantRouter.post('/query', requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = aiQuerySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid assistant query', details: parsed.error.flatten() });
    return;
  }

  const response = await runAssistantQuery({
    user: req.user!,
    message: parsed.data.message,
    language: parsed.data.language,
    conversationId: parsed.data.conversationId,
    confirmedActionToken: parsed.data.confirmedActionToken,
  });

  res.json(response);
});

assistantRouter.post('/voice/normalize', requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = voiceNormalizeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid voice normalization request', details: parsed.error.flatten() });
    return;
  }

  const result = await normalizeVoiceOrText(parsed.data.rawTranscript, parsed.data.languageHint);
  res.json(result);
});
