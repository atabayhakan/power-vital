import { logger } from '../utils/logger';
// 🛡️ Lazy-loaded GoogleGenAI import — prevents boot crash if the package
// is missing. We only attempt the import when translation is actually
// requested, and gracefully fall back if the dependency or API key is
// not configured.

type GoogleGenAIInstance = any;
let ai: GoogleGenAIInstance | null = null;
let importAttempted = false;

const tryLoadAI = async (): Promise<GoogleGenAIInstance | null> => {
  if (ai) return ai;
  if (importAttempted) return null;
  importAttempted = true;
  try {
    const mod = await import('@google/genai' as string).catch(() => null);
    if (!mod || !mod.GoogleGenAI) {
      logger.warn('[aiTranslator] @google/genai is not installed — translation disabled');
      return null;
    }
    if (!process.env.GEMINI_API_KEY) {
      logger.warn('[aiTranslator] GEMINI_API_KEY not set — translation disabled');
      return null;
    }
    ai = new mod.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    return ai;
  } catch (e) {
    logger.error({ err: e }, '[aiTranslator] Failed to initialise GoogleGenAI:');
    return null;
  }
};

// When the daily Gemini quota is exhausted (429 RESOURCE_EXHAUSTED) the sweeper
// would otherwise keep firing thousands of doomed requests every few minutes.
// After a quota error we pause ALL calls for a cooldown so we stop hammering.
let quotaBlockedUntil = 0;
const QUOTA_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

const sourceFallback = (text: string, targetLangs: string[]): Record<string, string> => {
  const fb: Record<string, string> = {};
  for (const lang of targetLangs) fb[lang] = text;
  return fb;
};

export async function translateContent(text: string, targetLangs: string[]): Promise<Record<string, string>> {
  if (Date.now() < quotaBlockedUntil) return sourceFallback(text, targetLangs);
  const client = await tryLoadAI();
  if (!client) {
    // 🛡️ Graceful fallback — return source text for every target language
    // so the API still works (just doesn't translate). Frontend can detect
    // this and prompt the user to configure GEMINI_API_KEY.
    const fallback: Record<string, string> = {};
    for (const lang of targetLangs) fallback[lang] = text;
    return fallback;
  }

  const prompt = `
You are a highly skilled professional e-commerce translator. Translate the following text into the requested languages.
Maintain the exact original meaning, tone, and formatting (e.g., if there are HTML tags or markdown, keep them).
Do not add any conversational text or explanations.

Requested Languages: ${targetLangs.join(', ')}

Text to translate:
"""
${text}
"""

Return your response strictly as a valid JSON object where the keys are the language codes (e.g., "ru", "kg", "en") and the values are the translated text. Do not wrap the JSON in Markdown formatting like \`\`\`json.
  `;

  // Gemini free tier frequently returns 503 (UNAVAILABLE / high demand).
  // Try a list of models and retry transient errors with backoff before
  // falling back to the source text.
  // gemini-2.0-flash-exp removed — it 404s (no longer served).
  const models = ['gemini-2.5-flash', 'gemini-flash-latest'];
  const maxRetries = 3;

  outer:
  for (const model of models) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await client.models.generateContent({
          model,
          contents: prompt,
          config: { temperature: 0.1 }
        });

        let output = response.text || '{}';
        output = output.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
        return JSON.parse(output);
      } catch (error: any) {
        const status = error?.status || error?.error?.code;
        console.error(`AI Translation error (model=${model}, attempt=${attempt}, status=${status}):`, error?.message || error);
        if (status === 429) {
          // Quota exhaustion is project-wide — no other model or retry will help
          // today, so pause everything and stop hammering the API.
          quotaBlockedUntil = Date.now() + QUOTA_COOLDOWN_MS;
          logger.warn(`[aiTranslator] Gemini quota exhausted (429); pausing AI translation for ${QUOTA_COOLDOWN_MS / 60000} min.`);
          break outer;
        }
        const transient = status === 503 || status === 500;
        if (transient && attempt < maxRetries) {
          await new Promise(r => setTimeout(r, attempt * 800)); // backoff
          continue;
        }
        break; // non-transient or out of retries → try next model
      }
    }
  }

  // Fallback: return source text rather than crashing
  const fallback: Record<string, string> = {};
  for (const lang of targetLangs) fallback[lang] = text;
  return fallback;
}
