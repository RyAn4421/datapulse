import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  console.log('GROQ KEY exists:', !!process.env.GROQ_API_KEY, 'length:', process.env.GROQ_API_KEY?.length)

  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { datasetName, headers, sampleRows, totalRows } = await req.json()

  if (!headers || !sampleRows) {
    return NextResponse.json({ error: 'Missing data' }, { status: 400 })
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 })
  }

  // Format sample data as readable table
  const sampleStr = [
    headers.join(' | '),
    '---',
    sampleRows.slice(0, 30).map((row: Record<string, unknown>) =>
      headers.map((h: string) => String(row[h] ?? '')).join(' | ')
    ).join('\n'),
  ].join('\n')

  const prompt = `You are a senior data analyst at a Big 4 consulting firm. Analyse this dataset and produce exactly 6 numbered insights.

Dataset: "${datasetName}"
Total rows: ${totalRows}
Columns: ${headers.join(', ')}

Sample data (first 30 rows):
${sampleStr}

Return ONLY a valid JSON array with exactly this structure — no markdown, no explanation, no code fences, just raw JSON:
[
  {
    "number": 1,
    "title": "Short insight title (max 6 words)",
    "finding": "One or two sentences explaining what the data shows. Be specific with numbers where possible.",
    "action": "One concrete action the user should take based on this finding.",
    "priority": "CRITICAL",
    "confidence": "High",
    "evidence": [
      "Specific data point 1 (e.g. '12 projects in Marketing')",
      "Specific data point 2 (e.g. 'Average spend: ₹135,000')"
    ],
    "metrics": {
      "value": 181256,
      "average": 135000,
      "delta": "+34% above average"
    }
  }
]

Rules:
- Priority must be one of: CRITICAL, HIGH, MEDIUM, LOW
- Assign CRITICAL to 1 finding, HIGH to 2, MEDIUM to 2, LOW to 1
- Confidence must be one of: High, Medium, Low
  - High   = strong evidence, multiple data points visible in the sample
  - Medium = partial evidence, moderate data points
  - Low    = limited data, directional only
- evidence must be an array of 2–4 short, specific strings referencing actual values from the data
- metrics.value is the key number for this insight (use 0 if not applicable)
- metrics.average is the mean of the relevant column (use 0 if not applicable)
- metrics.delta is a human-readable delta string (e.g. "+34% above average", "N/A" if not applicable)
- Write in plain English — no jargon
- The audience is a business graduate, not a data scientist
- Focus on patterns, outliers, comparisons, trends, and anomalies visible in the data
- Be specific — mention actual column names and approximate values from the data
- Return exactly 6 insights, numbered 1 through 6`

  try {
    // 8-second timeout — per spec Section 1 risk mitigation
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2500,
        temperature: 0.7,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const err = await response.text()
      console.error('Groq API error:', err)
      return NextResponse.json({ error: 'Groq API error' }, { status: 500 })
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content ?? '[]'
    const clean = text.replace(/```json|```/g, '').trim()

    let insights: any[]
    try {
      insights = JSON.parse(clean)
    } catch {
      console.error('[Insights] Malformed JSON from LLM:', text)
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    if (!Array.isArray(insights)) {
      console.error('[Insights] Response is not an array:', text)
      throw new Error('Response is not an array')
    }

    // Validate and normalise each insight — ensure backwards-compat fields exist
    const validated = insights.map((ins: any, i: number) => ({
      number:     ins.number     ?? i + 1,
      title:      ins.title      ?? 'Insight',
      finding:    ins.finding    ?? '',
      action:     ins.action     ?? '',
      priority:   ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(ins.priority) ? ins.priority : 'MEDIUM',
      // Sprint 1B additions
      confidence: ['High', 'Medium', 'Low'].includes(ins.confidence) ? ins.confidence : 'Medium',
      evidence:   Array.isArray(ins.evidence) ? ins.evidence : [],
      metrics: {
        value:   typeof ins.metrics?.value   === 'number' ? ins.metrics.value   : 0,
        average: typeof ins.metrics?.average === 'number' ? ins.metrics.average : 0,
        delta:   typeof ins.metrics?.delta   === 'string' ? ins.metrics.delta   : 'N/A',
      },
    }))

    console.log('[Insights] Validated:', validated.length, 'insights with evidence')
    return NextResponse.json({ insights: validated })

  } catch (e: any) {
    if (e.name === 'AbortError') {
      console.error('[Insights] Groq timeout (>8s)')
      return NextResponse.json({ error: 'Request timed out. Please try again.' }, { status: 504 })
    }
    console.error('AI insights error:', e)
    return NextResponse.json(
      { error: 'Failed to generate insights. Please try again.' },
      { status: 500 }
    )
  }
}
