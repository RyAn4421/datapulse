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

  try {
    const body = await req.json();
    const { datasetId, executiveSummary, metrics, charts } = body;

    if (!datasetId || !executiveSummary || !metrics || !charts) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const userId = (session.user as any).id || session.user.email;

    await connectDB();

    // Verify ownership of the dataset
    const dataset = await Dataset.findOne({ _id: datasetId, userId }).lean();
    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found or unauthorized' }, { status: 404 });
    }

    // Generate cryptographically secure token
    const token = crypto.randomBytes(32).toString('hex');

    // Create the snapshot
    const sharedReport = await SharedReport.create({
      token,
      ownerId: userId,
      datasetId: datasetId,
      datasetName: dataset.name,
      executiveSummary,
      metrics,
      charts,
      generatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      url: `/shared/${token}`,
    });
  } catch (error) {
    console.error('[Share API] Error creating share link:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
