import { createClient } from 'npm:@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const FREE_PLAN_MONTHLY_LIMIT = 3

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    // ── JWT validation ──────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return json({ error: 'Unauthorized' }, 401)
    }

    // ── Parse body ──────────────────────────────────────────────────────────
    let body: { content?: string; count?: number; examId?: string }
    try {
      body = await req.json()
    } catch {
      return json({ error: 'Invalid JSON body' }, 400)
    }

    const { content, count, examId } = body
    if (!content || typeof content !== 'string' || !content.trim()) {
      return json({ error: 'Feld "content" fehlt oder ist leer.' }, 400)
    }
    if (!count || typeof count !== 'number' || count < 1 || count > 50) {
      return json({ error: 'Feld "count" muss eine Zahl zwischen 1 und 50 sein.' }, 400)
    }
    if (!examId || typeof examId !== 'string') {
      return json({ error: 'Feld "examId" fehlt.' }, 400)
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // ── Free-plan limit ─────────────────────────────────────────────────────
    const { data: profile } = await adminClient
      .from('user_profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    if (!profile || profile.plan !== 'premium') {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { count: usedCount } = await adminClient
        .from('ai_generations')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString())

      if ((usedCount ?? 0) >= FREE_PLAN_MONTHLY_LIMIT) {
        return json(
          { error: 'Free-Limit erreicht. Upgrade auf Premium.' },
          403,
        )
      }
    }

    // ── Anthropic API ───────────────────────────────────────────────────────
    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

    const systemPrompt = `Du bist ein Lerncoach für Studierende. Erstelle aus dem gegebenen Text präzise Lernkarten im JSON-Format.

Antworte NUR mit einem validen JSON-Array ohne weiteren Text, Markdown oder Codeblöcke:
[
  { "front": "Frage oder Begriff", "back": "Antwort oder Erklärung" }
]

Regeln:
- Erstelle genau ${count} Karte${count === 1 ? '' : 'n'}
- Jede Karte deckt einen klar abgrenzbaren Sachverhalt ab
- Fragen sind klar und eindeutig formuliert
- Antworten sind prägnant, aber vollständig
- Nutze die Sprache des Eingabetexts`

    let claudeResponse: Anthropic.Message
    try {
      claudeResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: content.trim() }],
      })
    } catch (err) {
      console.error('Anthropic API error:', err)
      return json(
        { error: 'KI-Dienst temporär nicht verfügbar. Bitte versuche es später erneut.' },
        502,
      )
    }

    // ── Parse Claude's response ─────────────────────────────────────────────
    const rawText =
      claudeResponse.content[0].type === 'text' ? claudeResponse.content[0].text : ''

    let cards: Array<{ front: string; back: string }>
    try {
      // Strip optional markdown fences that Claude might add anyway
      const cleaned = rawText.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim()
      const match = cleaned.match(/\[[\s\S]*\]/)
      if (!match) throw new Error('No JSON array found')
      cards = JSON.parse(match[0])
      if (!Array.isArray(cards) || cards.length === 0) throw new Error('Empty array')
    } catch (err) {
      console.error('JSON parse error:', err, '\nRaw text:', rawText)
      return json(
        { error: 'Fehler beim Verarbeiten der KI-Antwort. Bitte versuche es erneut.' },
        500,
      )
    }

    // ── Save flashcards ─────────────────────────────────────────────────────
    const today = new Date().toISOString().split('T')[0]
    const flashcardsToInsert = cards.map((card) => ({
      exam_id: examId,
      user_id: user.id,
      front: card.front,
      back: card.back,
      interval: 1,
      easiness_factor: 2.5,
      repetitions: 0,
      next_review: today,
    }))

    const { error: insertError } = await adminClient
      .from('flashcards')
      .insert(flashcardsToInsert)

    if (insertError) {
      console.error('Flashcard insert error:', insertError)
      return json({ error: 'Fehler beim Speichern der Karten.' }, 500)
    }

    // ── Log generation ──────────────────────────────────────────────────────
    await adminClient.from('ai_generations').insert({
      user_id: user.id,
      type: 'flashcards',
      cards_generated: cards.length,
    })

    return json({ success: true, cards, count: cards.length })
  } catch (err) {
    console.error('Unexpected error:', err)
    return json({ error: 'Ein unerwarteter Fehler ist aufgetreten.' }, 500)
  }
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
