import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { Notification } from '@/lib/models/Notification';

// GET — list latest 100 notifications for current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const notifications = await Notification.find({ userId: session.user.email })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return NextResponse.json(notifications);
}

// POST — create a new notification (called from internal event points)
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

  const { type, title, message, href } = body;
  if (!type || !title || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  await connectDB();

  // Enforce 100-notification cap: delete oldest if at limit
  const count = await Notification.countDocuments({ userId: session.user.email });
  if (count >= 100) {
    const oldest = await Notification.find({ userId: session.user.email })
      .sort({ createdAt: 1 })
      .limit(count - 99)
      .select('_id');
    await Notification.deleteMany({ _id: { $in: oldest.map((n) => n._id) } });
  }

  const notification = await Notification.create({
    userId: session.user.email,
    type,
    title,
    message,
    href: href || undefined,
    read: false,
  });

  return NextResponse.json(notification, { status: 201 });
}

// DELETE — clear all notifications for current user
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  await Notification.deleteMany({ userId: session.user.email });

  return NextResponse.json({ success: true });
}
