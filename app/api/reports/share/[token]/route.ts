import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { SharedReport } from '@/lib/models/SharedReport';

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    await connectDB();
    const token = params.token;

    const report = await SharedReport.findOne({ token }).lean() as any;

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (report.revokedAt) {
      return NextResponse.json({ error: 'This report link has been revoked by the owner.' }, { status: 403 });
    }

    // STRICTLY strip internal identifiers
    const safePayload = {
      datasetName: report.datasetName,
      executiveSummary: report.executiveSummary,
      metrics: report.metrics,
      charts: report.charts,
      generatedAt: report.generatedAt,
    };

    return NextResponse.json(safePayload);
  } catch (error) {
    console.error('[Share API] Error fetching shared report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { token: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const token = params.token;
    const userId = (session.user as any).id || session.user.email;

    const report = await SharedReport.findOne({ token, ownerId: userId });

    if (!report) {
      return NextResponse.json({ error: 'Report not found or unauthorized' }, { status: 404 });
    }

    if (report.revokedAt) {
      return NextResponse.json({ success: true, message: 'Already revoked' });
    }

    report.revokedAt = new Date();
    report.revokedBy = userId;
    await report.save();

    return NextResponse.json({ success: true, message: 'Report link revoked' });
  } catch (error) {
    console.error('[Share API] Error revoking report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
