import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { Notification } from '@/lib/models/Notification';

// PATCH — mark a single notification as read
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const notification = await Notification.findOneAndUpdate(
    { _id: params.id, userId: session.user.email },
    { read: true },
    { new: true }
  );

  if (!notification) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(notification);
}

// DELETE — delete a single notification
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  await Notification.findOneAndDelete({ _id: params.id, userId: session.user.email });

  return NextResponse.json({ success: true });
}
