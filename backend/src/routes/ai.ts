import { Router, Request, Response } from 'express';
import { translateContent } from '../services/aiTranslator';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { validate, AITranslateSchema } from '../validators';
import { limit, RATE_LIMITS } from '../utils/rateLimit';
import { logger } from '../utils/logger';

const router = Router();

// Protected: only authenticated admins may trigger (paid) AI translation calls.
// 20/min per user — protects the Gemini API budget.
router.post('/translate', authenticateJWT, requireRole('admin'), limit(RATE_LIMITS.ai.translate), validate({ body: AITranslateSchema }), async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, targetLangs } = req.body as { text: string; targetLangs: string[] };

    const translations = await translateContent(text, targetLangs);
    res.json({ translations });
  } catch (error: any) {
    logger.error({ err: error }, 'Translation route error:');
    res.status(500).json({ error: error.message || 'Failed to translate' });
  }
});

export default router;
