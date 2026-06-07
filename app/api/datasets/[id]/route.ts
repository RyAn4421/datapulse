import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { Dataset } from '@/lib/models/Dataset';
import { Row } from '@/lib/models/Row';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id || session.user.email;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: User identifier missing' }, { status: 401 });
    }

    await connectDB();

    const dataset = await Dataset.findById(params.id);
    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    if (dataset.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch associated rows
    const rows = await Row.find({ datasetId: params.id }).sort({ rowIndex: 1 }).lean();

    return NextResponse.json({
      ...dataset.toObject(),
      rows: rows.map((r) => r.data),
    });
  } catch (error) {
    console.error('Failed to get dataset:', error);
    return NextResponse.json({ error: 'Failed to get dataset' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id || session.user.email;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: User identifier missing' }, { status: 401 });
    }

    await connectDB();

    const dataset = await Dataset.findById(params.id);
    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    if (dataset.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Cascade delete rows
    await Row.deleteMany({ datasetId: params.id });

    // Delete dataset metadata
    await Dataset.deleteOne({ _id: params.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete dataset:', error);
    return NextResponse.json({ error: 'Failed to delete dataset' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id || session.user.email;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const dataset = await Dataset.findById(params.id);
    if (!dataset) return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    if (dataset.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    if (body.name) {
      dataset.name = body.name;
      await dataset.save();
    }

    return NextResponse.json(dataset);
  } catch (error) {
    console.error('Failed to update dataset:', error);
    return NextResponse.json({ error: 'Failed to update dataset' }, { status: 500 });
  }
}
