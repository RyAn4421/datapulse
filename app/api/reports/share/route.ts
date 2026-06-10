import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { Dataset } from '@/lib/models/Dataset';
import { SharedReport } from '@/lib/models/SharedReport';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { datasetId, executiveSummary, metrics, charts } = body;

  // ── Field-level validation ──────────────────────────────────────────────────
  if (!datasetId) {
    return NextResponse.json({ error: 'Missing required field: datasetId' }, { status: 400 });
  }
  if (!executiveSummary) {
    return NextResponse.json({ error: 'Missing required field: executiveSummary' }, { status: 400 });
  }
  if (!metrics) {
    return NextResponse.json({ error: 'Missing required field: metrics' }, { status: 400 });
  }
  if (!Array.isArray(charts) || charts.length === 0) {
    return NextResponse.json({ error: 'Missing required field: charts (must be non-empty array)' }, { status: 400 });
  }

  // ── Stale summary guard ─────────────────────────────────────────────────────
  // Datasets summarized before Sprint 3 have only 4 fields (no opportunities).
  // Return 409 so the client can surface a user-readable message instead of
  // silently failing with a Mongoose ValidationError → 500.
  if (!executiveSummary.opportunities) {
    console.warn('[Share API] Stale AI summary detected — missing opportunities field. datasetId:', datasetId);
    return NextResponse.json(
      {
        error: 'summary_stale',
        message: 'AI summary is outdated. Please regenerate the summary and try again.',
      },
      { status: 409 }
    );
  }

  const userId = (session.user as any).id || session.user.email;

  try {
    await connectDB();

    // ── Ownership check ───────────────────────────────────────────────────────
    const dataset = await Dataset.findOne({ _id: datasetId, userId }).lean();
    if (!dataset) {
      console.warn('[Share API] Dataset not found or unauthorized. datasetId:', datasetId, 'userId:', userId);
      return NextResponse.json({ error: 'Dataset not found or unauthorized' }, { status: 404 });
    }

    // ── Token generation ──────────────────────────────────────────────────────
    const token = crypto.randomBytes(32).toString('hex');

    // ── Snapshot write ────────────────────────────────────────────────────────
    await SharedReport.create({
      token,
      ownerId: userId,
      datasetId: datasetId,
      datasetName: dataset.name,
      executiveSummary: {
        overview:       executiveSummary.overview       ?? '',
        topCategory:    executiveSummary.topCategory    ?? '',
        risk:           executiveSummary.risk           ?? '',
        opportunities:  executiveSummary.opportunities  ?? '',
        recommendation: executiveSummary.recommendation ?? '',
      },
      metrics: {
        rowCount:   metrics.rowCount   ?? 0,
        colCount:   metrics.colCount   ?? 0,
        totalValue: metrics.totalValue ?? 0,
        avgValue:   metrics.avgValue   ?? 0,
        numColName: metrics.numColName ?? '',
        catColName: metrics.catColName ?? '',
      },
      charts,
      generatedAt: new Date(),
    });

    console.log('[Share API] Share link created. token:', token.slice(0, 8) + '…', 'datasetId:', datasetId);

    return NextResponse.json({
      success: true,
      url: `/shared/${token}`,
    });

  } catch (error: any) {
    // ── Structured error logging ──────────────────────────────────────────────
    if (error?.name === 'ValidationError') {
      // Mongoose schema validation failure — log every failing path
      const paths = Object.keys(error.errors ?? {});
      console.error(
        '[Share API] Mongoose ValidationError — failing paths:', paths,
        '\nFull error:', error.message
      );
      return NextResponse.json(
        { error: 'validation_error', message: `Schema validation failed: ${paths.join(', ')}` },
        { status: 422 }
      );
    }

    if (error?.name === 'CastError') {
      console.error('[Share API] Mongoose CastError — path:', error.path, 'value:', error.value, '\nFull error:', error.message);
      return NextResponse.json(
        { error: 'cast_error', message: `Invalid value for field: ${error.path}` },
        { status: 400 }
      );
    }

    if (error?.code === 11000) {
      // Duplicate token — astronomically unlikely with 256-bit entropy, but handle it
      console.error('[Share API] Duplicate token collision. Retry the request.');
      return NextResponse.json(
        { error: 'token_collision', message: 'Token collision. Please try again.' },
        { status: 409 }
      );
    }

    // Unknown error
    console.error('[Share API] Unexpected error creating share link:', error);
    return NextResponse.json(
      { error: 'server_error', message: 'An unexpected server error occurred.' },
      { status: 500 }
    );
  }
}
