import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { ActivityLog } from '@/lib/models/ActivityLog';

const MAX_ENTRIES = 50;

// GET — list activity log for current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const activities = await ActivityLog.find({ userId: session.user.email })
    .sort({ createdAt: -1 })
    .limit(MAX_ENTRIES)
    .lean();

  return NextResponse.json(activities);
}

// POST — create an activity log entry
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { type, label, datasetId, datasetName, meta } = body;
  if (!type || !label) {
    return NextResponse.json({ error: 'Missing required fields: type, label' }, { status: 400 });
  }

  await connectDB();

  // Enforce 50-entry cap: remove oldest entries beyond limit
  const count = await ActivityLog.countDocuments({ userId: session.user.email });
  if (count >= MAX_ENTRIES) {
    const toDelete = await ActivityLog.find({ userId: session.user.email })
      .sort({ createdAt: 1 })
      .limit(count - MAX_ENTRIES + 1)
      .select('_id');
    await ActivityLog.deleteMany({ _id: { $in: toDelete.map((a) => a._id) } });
  }

  const entry = await ActivityLog.create({
    userId: session.user.email,
    type,
    label,
    datasetId: datasetId || undefined,
    datasetName: datasetName || undefined,
    meta: meta || undefined,
  });

  return NextResponse.json(entry, { status: 201 });
}

// DELETE — clear all activity for current user
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  await ActivityLog.deleteMany({ userId: session.user.email });

  return NextResponse.json({ success: true });
}
