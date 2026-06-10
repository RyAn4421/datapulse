import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { Dataset } from '@/lib/models/Dataset'
import { Row } from '@/lib/models/Row'
import { createHash } from 'crypto'

export const dynamic = 'force-dynamic'

// ── Hash ─────────────────────────────────────────────────────────────────────
// SHA-256 of headers + first 100 rows JSON + rowCount
// Modification to any of those three inputs invalidates the cache automatically.
function computeSummaryHash(
  headers: string[],
  rows: Record<string, unknown>[],
  rowCount: number
): string {
  const content = `${headers.join(',')}:${JSON.stringify(rows.slice(0, 100))}:${rowCount}`
  return createHash('sha256').update(content).digest('hex')
}

// ── Route ─────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  // Auth
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const datasetId = searchParams.get('datasetId')
  const force = searchParams.get('force') === 'true'

  if (!datasetId) {
    return NextResponse.json({ error: 'datasetId required' }, { status: 400 })
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 })
  }

  const userId = (session.user as any).id || session.user.email

  await connectDB()

  // Fetch dataset — enforce ownership (never serve another user's data)
  const dataset = await Dataset.findOne({ _id: datasetId, userId }).lean() as any
  if (!dataset) {
    return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
  }

  // Minimum row guard
  if ((dataset.rowCount ?? 0) < 20) {
    return NextResponse.json(
      {
        error: 'too_small',
        message: 'Dataset too small for meaningful analysis. Minimum 20 records recommended.',
      },
      { status: 422 }
    )
  }

  // Fetch first 100 rows for hashing (same rows used for cache key)
  const hashRows = await Row.find({ datasetId })
    .sort({ rowIndex: 1 })
    .limit(100)
    .lean()
    .then((rs) => rs.map((r) => r.data as Record<string, unknown>))

  const currentHash = computeSummaryHash(dataset.headers ?? [], hashRows, dataset.rowCount)

  // ── Cache hit ────────────────────────────────────────────────────────────────
  if (!force && dataset.aiSummary && dataset.summaryHash === currentHash) {
    console.log('[Summary] Cache HIT — dataset:', datasetId)
    return NextResponse.json({ summary: dataset.aiSummary, cached: true })
  }

  console.log('[Summary] Cache MISS — calling Groq for dataset:', datasetId)

  // Prompt uses first 30 rows (token budget control)
  const promptRows = hashRows.slice(0, 30)
  const sampleStr = [
    dataset.headers.join(' | '),
    '---',
    promptRows
      .map((row) =>
        dataset.headers.map((h: string) => String(row[h] ?? '').substring(0, 100)).join(' | ')
      )
      .join('\n'),
  ].join('\n')

  const prompt = `You are a senior data analyst at a Big 4 consulting firm.

Dataset: "${dataset.name}"
Total rows: ${dataset.rowCount}
Columns: ${dataset.headers.join(', ')}

Sample data (first 30 rows):
${sampleStr}

Return ONLY a valid JSON object with exactly this structure — no markdown, no explanation, no code fences:
{
  "overview":       "One sentence summarising the dataset purpose and scale. Max 50 words.",
  "topCategory":    "The single most significant category or segment finding. Max 30 words.",
  "risk":           "The most important data or business risk identified. Max 40 words.",
  "opportunities":  "One or two specific opportunities for improvement or growth based on the data. Max 40 words.",
  "recommendation": "One specific, actionable recommendation. Reference actual column names and values from the data. Max 40 words."
}

Rules:
- Total word count across all five fields must not exceed 250 words.
- Return only valid JSON. No preamble. No trailing text.
- Make the recommendation specific and actionable — not generic. Weak: "Review your data." Strong: "Marketing spend is 2.3x above average. Rebalance budget toward lower-cost, higher-ROI categories before Q3."`

  // ── Groq call with 8-second timeout ──────────────────────────────────────────
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 450,
        temperature: 0.35,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!groqRes.ok) {
      const errText = await groqRes.text()
      console.error('[Summary] Groq API error:', errText)
      return NextResponse.json({ error: 'groq_api_error' }, { status: 502 })
    }

    const groqData = await groqRes.json()
    const rawText: string = groqData.choices?.[0]?.message?.content ?? ''

    // ── JSON parse ───────────────────────────────────────────────────────────
    let summary: any
    try {
      const firstBrace = rawText.indexOf('{')
      const lastBrace = rawText.lastIndexOf('}')
      if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
        throw new Error('No JSON object found')
      }
      const cleanText = rawText.substring(firstBrace, lastBrace + 1)
      summary = JSON.parse(cleanText)
    } catch {
      console.error('[Summary] Malformed JSON from LLM:', rawText)
      return NextResponse.json({ error: 'malformed_response' }, { status: 502 })
    }

    // ── Validate all 5 required keys ─────────────────────────────────────────
    const REQUIRED_KEYS = ['overview', 'topCategory', 'risk', 'recommendation', 'opportunities'] as const
    const missingKeys = REQUIRED_KEYS.filter(
      (k) => !summary[k] || typeof summary[k] !== 'string'
    )
    if (missingKeys.length > 0) {
      console.error('[Summary] Missing keys in LLM response:', missingKeys, rawText)
      return NextResponse.json({ error: 'malformed_response' }, { status: 502 })
    }

    // ── Write cache to Dataset document ──────────────────────────────────────
    await Dataset.findByIdAndUpdate(datasetId, {
      aiSummary: {
        overview:       summary.overview,
        topCategory:    summary.topCategory,
        risk:           summary.risk,
        recommendation: summary.recommendation,
        opportunities:  summary.opportunities,
      },
      summaryHash:        currentHash,
      summaryGeneratedAt: new Date(),
    })

    console.log('[Summary] Generated and cached — dataset:', datasetId)
    return NextResponse.json({ summary, cached: false })

  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.error('[Summary] Groq timeout (>8s) — dataset:', datasetId)
      // Return cached summary if available, even if stale — better than a blank panel
      if (dataset.aiSummary) {
        console.log('[Summary] Serving stale cache after timeout — dataset:', datasetId)
        return NextResponse.json({ summary: dataset.aiSummary, cached: true, stale: true })
      }
      return NextResponse.json({ error: 'groq_timeout' }, { status: 504 })
    }
    console.error('[Summary] Unexpected error:', err)
    return NextResponse.json({ error: 'groq_api_error' }, { status: 500 })
  }
}
