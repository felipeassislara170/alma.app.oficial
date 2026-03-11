import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import OpenAI from 'openai';

admin.initializeApp();

const openaiApiKey = defineSecret('OPENAI_API_KEY');

/** Max requests per user per sliding-window hour */
const RATE_LIMIT = 20;
const WINDOW_MS = 3_600_000; // 1 hour in ms

const ALLOWED_ORIGINS = [
  'https://felipeassislara170.github.io',
  'http://localhost:5173',
  'http://localhost:4173',
];

function setCorsHeaders(req: { headers: { origin?: string } }, res: { set: (k: string, v: string) => void }): void {
  const origin = req.headers.origin ?? '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  res.set('Access-Control-Allow-Origin', allowedOrigin);
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export const chat = onRequest(
  {
    region: 'southamerica-east1',
    secrets: [openaiApiKey],
    timeoutSeconds: 60,
  },
  async (req, res) => {
    setCorsHeaders(req, res);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Método não permitido.' });
      return;
    }

    // ── Auth ──────────────────────────────────────────────────────────────
    const authHeader = (req.headers.authorization as string | undefined) ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Não autorizado.' });
      return;
    }
    const idToken = authHeader.slice(7);
    let uid: string;
    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      uid = decoded.uid;
    } catch {
      res.status(401).json({ error: 'Token inválido ou expirado.' });
      return;
    }

    // ── Payload validation ────────────────────────────────────────────────
    const body = req.body as { message?: unknown };
    const message = body.message;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ error: 'Campo "message" é obrigatório.' });
      return;
    }
    if (message.length > 1000) {
      res.status(400).json({ error: 'Mensagem muito longa (máximo 1000 caracteres).' });
      return;
    }

    // ── Rate limiting (Firestore – best effort) ───────────────────────────
    const now = Date.now();
    const windowStart = now - WINDOW_MS;
    const db = admin.firestore();
    const rateLimitRef = db.collection('rate_limits').doc(uid);

    class RateLimitError extends Error {
      constructor() { super('RATE_LIMIT'); }
    }

    try {
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(rateLimitRef);
        const data = snap.data() ?? {};
        const requests: number[] = ((data.requests as number[] | undefined) ?? []).filter(
          (t) => t > windowStart,
        );
        if (requests.length >= RATE_LIMIT) {
          throw new RateLimitError();
        }
        requests.push(now);
        tx.set(rateLimitRef, { requests });
      });
    } catch (err) {
      if (err instanceof RateLimitError) {
        res.status(429).json({
          error: 'Limite de mensagens atingido. Tente novamente em 1 hora.',
        });
        return;
      }
      // Rate-limit failure is non-fatal — log and continue
      console.warn('[chat] rate-limit check failed (non-fatal):', (err as Error).message);
    }

    // ── OpenAI ────────────────────────────────────────────────────────────
    const openai = new OpenAI({ apiKey: openaiApiKey.value() });

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 500,
import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import OpenAI from 'openai'

admin.initializeApp()

const db = admin.firestore()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// ── Constants ──────────────────────────────────────────────────────────────────
const MAX_MESSAGE_LENGTH = 2000
const RATE_LIMIT_MAX = 20     // max messages per window
const RATE_LIMIT_WINDOW_MS = 60 * 1000  // 1 minute window

// Allowed origins: Firebase Hosting and localhost for development
const ALLOWED_ORIGINS = [
  /^https:\/\/.*\.firebaseapp\.com$/,
  /^https:\/\/.*\.web\.app$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
]

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false
  return ALLOWED_ORIGINS.some((re) => re.test(origin))
}

/**
 * Simple per-uid rate limiting using Firestore.
 * Returns true if the request is within limits, false if rate-limited.
 */
async function checkRateLimit(uid: string): Promise<boolean> {
  const ref = db.collection('rateLimits').doc(uid)
  const now = Date.now()

  try {
    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      const data = snap.data() as { count: number; windowStart: number } | undefined

      if (!data || now - data.windowStart > RATE_LIMIT_WINDOW_MS) {
        // New window: reset counter
        tx.set(ref, { count: 1, windowStart: now })
        return true
      }

      if (data.count >= RATE_LIMIT_MAX) {
        return false
      }

      tx.update(ref, { count: data.count + 1 })
      return true
    })
    return result
  } catch (err) {
    // On Firestore error, allow the request (fail open) but log it
    console.error('Rate limit check failed:', err)
    return true
  }
}

/**
 * POST /api/chat
 * Requires: Authorization: Bearer <Firebase ID token>
 * Body: { message: string }  (max 2000 chars)
 * Returns: { reply: string }
 */
export const chat = functions
  .runWith({ secrets: ['OPENAI_API_KEY'] })
  .https.onRequest(async (req, res) => {
    // CORS
    const origin = req.headers.origin
    if (isAllowedOrigin(origin)) {
      res.set('Access-Control-Allow-Origin', origin!)
    }
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.set('Vary', 'Origin')
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.authorization ?? ''
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid Authorization header' })
      return
    }

    const idToken = authHeader.slice(7)
    let uid: string
    try {
      const decoded = await admin.auth().verifyIdToken(idToken)
      uid = decoded.uid
    } catch {
      res.status(401).json({ error: 'Invalid or expired token' })
      return
    }

    // ── Payload validation ────────────────────────────────────────────────────
    const { message } = req.body as { message?: unknown }
    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'message is required and must be a non-empty string' })
      return
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      res.status(400).json({
        error: `message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`,
      })
      return
    }

    // ── Rate limiting ─────────────────────────────────────────────────────────
    const allowed = await checkRateLimit(uid)
    if (!allowed) {
      res.status(429).json({
        error: 'Muitas mensagens em pouco tempo. Aguarde um momento e tente novamente.',
      })
      return
    }

    // ── OpenAI ────────────────────────────────────────────────────────────────
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Você é Alma, uma mentora emocional empática e acolhedora. ' +
              'Sempre responda em português do Brasil com calor humano, empatia e sabedoria. ' +
              'Ajude o usuário a refletir sobre seus sentimentos de forma gentil e encorajadora. ' +
              'Mantenha respostas concisas (máximo 3 parágrafos curtos).',
          },
          { role: 'user', content: message.trim() },
        ],
      });

      const reply =
        completion.choices[0]?.message?.content ??
        'Não consegui processar sua mensagem. Tente novamente.';

      console.info(
        `[chat] uid=${uid.slice(0, 8)}… tokens=${completion.usage?.total_tokens ?? '?'}`,
      );

      res.status(200).json({ reply });
    } catch (err) {
      console.error('[chat] OpenAI error:', err);
      res.status(500).json({ error: 'Serviço temporariamente indisponível. Tente novamente.' });
    }
  },
);
              'Você é a Alma, uma assistente de bem-estar mental empática e acolhedora. ' +
              'Responda sempre em português do Brasil, de forma calorosa, sem julgamentos e de forma concisa. ' +
              'Você oferece apoio emocional, sugestões de meditação, técnicas de respiração e dicas de bem-estar. ' +
              'Nunca substitua um profissional de saúde mental — quando adequado, incentive o usuário a buscar ajuda profissional.',
          },
          { role: 'user', content: message.trim() },
        ],
        max_tokens: 512,
        temperature: 0.7,
      })

      const choice = completion.choices[0]
      let reply: string

      // Handle content filtering (legacy finish_reason) and modern refusal field
      if (
        choice?.finish_reason === 'content_filter' ||
        (choice?.message as { refusal?: string } | undefined)?.refusal
      ) {
        reply = 'Não consigo responder a essa mensagem. Por favor, tente reformular sua pergunta.'
      } else {
        reply =
          choice?.message?.content?.trim() ||
          'Desculpe, não consegui gerar uma resposta agora. Tente novamente.'
      }

      res.status(200).json({ reply })
    } catch (err) {
      console.error('OpenAI error:', err)
      res.status(502).json({ error: 'Não foi possível obter resposta da IA. Tente novamente.' })
    }
  })
