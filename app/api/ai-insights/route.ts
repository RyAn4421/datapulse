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
    "priority": "CRITICAL"
  }
]

Rules:
- Priority must be one of: CRITICAL, HIGH, MEDIUM, LOW
- Assign CRITICAL to 1 finding, HIGH to 2, MEDIUM to 2, LOW to 1
- Write in plain English — no jargon
- The audience is a business graduate, not a data scientist
- Focus on patterns, outliers, comparisons, trends, and anomalies visible in the data
- Be specific — mention actual column names and approximate values from the data
- Return exactly 6 insights, numbered 1 through 6`

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Groq API error:', err)
      return NextResponse.json({ error: 'Groq API error' }, { status: 500 })
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content ?? '[]'
    const clean = text.replace(/```json|```/g, '').trim()
    const insights = JSON.parse(clean)

    if (!Array.isArray(insights)) {
      throw new Error('Response is not an array')
    }

    return NextResponse.json({ insights })


  } catch (e) {
    console.error('AI insights error:', e)
    return NextResponse.json(
      { error: 'Failed to generate insights. Please try again.' },
      { status: 500 }
    )
  }
}
