import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { Dataset } from '@/lib/models/Dataset';
import { Row } from '@/lib/models/Row';
import { Comparison } from '@/lib/models/Comparison';
import { createHash } from 'crypto';
import { calculateUniversalMetrics } from '@/lib/analytics/universal-metrics';

export const dynamic = 'force-dynamic';

function computeContentHash(
  headers: string[],
  rows: Record<string, unknown>[],
  rowCount: number
): string {
  const content = `${headers.join(',')}:${JSON.stringify(rows.slice(0, 100))}:${rowCount}`;
  return createHash('sha256').update(content).digest('hex');
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const datasetAId = searchParams.get('datasetAId');
  const datasetBId = searchParams.get('datasetBId');
  const force = searchParams.get('force') === 'true';

  if (!datasetAId || !datasetBId) {
    return NextResponse.json({ error: 'Both datasetAId and datasetBId required' }, { status: 400 });
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });
  }

  const userId = (session.user as any).id || session.user.email;
  await connectDB();

  // 1. Fetch datasets
  const datasetA = await Dataset.findOne({ _id: datasetAId, userId }).lean() as any;
  const datasetB = await Dataset.findOne({ _id: datasetBId, userId }).lean() as any;

  if (!datasetA || !datasetB) {
    return NextResponse.json({ error: 'One or both datasets not found' }, { status: 404 });
  }

  // 2. Fetch data (up to 2000 rows for accurate metrics, but 100 for hash, 30 for LLM)
  // To keep it fast, we will fetch up to 1000 rows for metrics estimation.
  const rowsA = await Row.find({ datasetId: datasetAId }).sort({ rowIndex: 1 }).limit(1000).lean()
    .then(rs => rs.map(r => r.data as Record<string, unknown>));
  const rowsB = await Row.find({ datasetId: datasetBId }).sort({ rowIndex: 1 }).limit(1000).lean()
    .then(rs => rs.map(r => r.data as Record<string, unknown>));

  // Compute metrics
  const metricsA = calculateUniversalMetrics(datasetA, rowsA);
  const metricsB = calculateUniversalMetrics(datasetB, rowsB);

  // 3. Compute combined content hash
  const hashA = datasetA.summaryHash || computeContentHash(datasetA.headers || [], rowsA, datasetA.rowCount);
  const hashB = datasetB.summaryHash || computeContentHash(datasetB.headers || [], rowsB, datasetB.rowCount);
  
  // Sort hashes to ensure Compare(A,B) uses the same cache as Compare(B,A)
  const cacheKey = [hashA, hashB].sort().join('_');

  // 4. Cache Check
  if (!force) {
    const cachedComparison = await Comparison.findOne({ hashKey: cacheKey }).lean() as any;
    if (cachedComparison) {
      console.log('[Compare AI] Cache HIT for:', cacheKey);
      return NextResponse.json({ summary: cachedComparison.summary, cached: true });
    }
  }

  console.log('[Compare AI] Cache MISS — calling Groq');

  // 5. Construct Prompt
  const promptHeadersA = datasetA.headers.slice(0, 10);
  const omittedColumnsA = datasetA.headers.length > 10 ? datasetA.headers.slice(10) : [];
  const sampleAStr = [
    promptHeadersA.join(' | '),
    '---',
    rowsA.slice(0, 20).map(row => promptHeadersA.map((h: string) => String(row[h] ?? '').substring(0, 100)).join(' | ')).join('\n'),
  ].join('\n');

  const promptHeadersB = datasetB.headers.slice(0, 10);
  const omittedColumnsB = datasetB.headers.length > 10 ? datasetB.headers.slice(10) : [];
  const sampleBStr = [
    promptHeadersB.join(' | '),
    '---',
    rowsB.slice(0, 20).map(row => promptHeadersB.map((h: string) => String(row[h] ?? '').substring(0, 100)).join(' | ')).join('\n'),
  ].join('\n');

  const prompt = `You are an expert data analyst. Compare these two datasets and generate a narrative summary.

DATASET A: "${datasetA.name}"
Rows: ${datasetA.rowCount} (Quality Score: ${metricsA.qualityScore}%, Missing: ${metricsA.missingValueRate.toFixed(1)}%, Duplicates: ${metricsA.duplicateRate.toFixed(1)}%)
Columns included in sample: ${promptHeadersA.join(', ')}
${omittedColumnsA.length > 0 ? `Omitted columns (due to size limits): ${omittedColumnsA.join(', ')}` : ''}
Sample Data A (first 20 rows):
${sampleAStr}

DATASET B: "${datasetB.name}"
Rows: ${datasetB.rowCount} (Quality Score: ${metricsB.qualityScore}%, Missing: ${metricsB.missingValueRate.toFixed(1)}%, Duplicates: ${metricsB.duplicateRate.toFixed(1)}%)
Columns included in sample: ${promptHeadersB.join(', ')}
${omittedColumnsB.length > 0 ? `Omitted columns (due to size limits): ${omittedColumnsB.join(', ')}` : ''}
Sample Data B (first 20 rows):
${sampleBStr}

Return ONLY a valid JSON object matching this interface exactly (no markdown, no preamble):
{
  "keyDifferences": "max 40 words",
  "qualityAssessment": "max 30 words",
  "riskAnalysis": "max 30 words",
  "recommendation": "max 30 words"
}

Rules:
- Total word count across all fields MUST NOT exceed 150 words.
- Reference the explicit scorecard metrics provided above.
- Be specific about columns and data types.`;

  // 6. Call Groq
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 350,
        temperature: 0.35,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!groqRes.ok) {
      const err = await groqRes.text();
      console.error('[Compare AI] Groq error:', err);
      let errorMsg = 'Failed to generate comparison.';
      try {
        const parsedErr = JSON.parse(err);
        errorMsg = parsedErr.error?.message || errorMsg;
      } catch { }

      if (groqRes.status === 429) {
        return NextResponse.json({ error: errorMsg, code: 'groq_rate_limit' }, { status: 429 });
      }
      return NextResponse.json({ error: errorMsg, code: 'groq_api_error' }, { status: groqRes.status });
    }

    const groqData = await groqRes.json();
    const rawText = groqData.choices?.[0]?.message?.content ?? '{}';
    
    let summary: any;
    try {
      summary = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ error: 'malformed_response' }, { status: 502 });
    }

    const REQUIRED_KEYS = ['keyDifferences', 'qualityAssessment', 'riskAnalysis', 'recommendation'];
    for (const key of REQUIRED_KEYS) {
      if (!summary[key] || typeof summary[key] !== 'string') {
        summary[key] = 'N/A'; // Fallback if missing
      }
    }

    // 7. Save to Cache
    try {
      await Comparison.create({
        hashKey: cacheKey,
        summary,
        datasetAId,
        datasetBId
      });
    } catch (dbErr) {
      console.error('[Compare AI] DB cache save error (ignoring):', dbErr);
    }

    return NextResponse.json({ summary, cached: false });

  } catch (err: any) {
    if (err.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timed out. Please try again.', code: 'groq_timeout' }, { status: 504 });
    }
    return NextResponse.json({ error: 'Failed to generate comparison.', code: 'groq_api_error' }, { status: 500 });
  }
}
