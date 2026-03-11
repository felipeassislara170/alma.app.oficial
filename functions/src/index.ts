import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import OpenAI from 'openai'

admin.initializeApp()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Allowed origins: the Firebase Hosting URL and localhost for development
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
 * POST /api/chat
 * Requires: Authorization: Bearer <Firebase ID token>
 * Body: { message: string }
 * Returns: { reply: string }
 */
export const chat = functions
  .runWith({ secrets: ['OPENAI_API_KEY'] })
  .https.onRequest(async (req, res) => {
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

    // Verify Firebase ID token
    const authHeader = req.headers.authorization ?? ''
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid Authorization header' })
      return
    }

    const idToken = authHeader.slice(7)
    try {
      await admin.auth().verifyIdToken(idToken)
    } catch {
      res.status(401).json({ error: 'Invalid or expired token' })
      return
    }

    const { message } = req.body as { message?: string }
    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'message is required' })
      return
    }

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
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

      if (choice?.finish_reason === 'content_filter') {
        reply = 'Não consigo responder a essa mensagem. Por favor, tente reformular sua pergunta.'
      } else {
        reply =
          choice?.message?.content?.trim() ||
          'Desculpe, não consegui gerar uma resposta agora. Tente novamente.'
      }

      res.status(200).json({ reply })
    } catch (err) {
      console.error('OpenAI error:', err)
      res.status(502).json({ error: 'Failed to get AI response' })
    }
  })
