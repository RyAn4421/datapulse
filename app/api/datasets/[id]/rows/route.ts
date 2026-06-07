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

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.max(parseInt(searchParams.get('limit') || '25'), 1);
    const search = searchParams.get('search') || '';

    await connectDB();

    // Verify dataset ownership first
    const dataset = await Dataset.findById(params.id);
    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    if (dataset.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const query: any = { datasetId: params.id };

    if (search && dataset.headers && dataset.headers.length > 0) {
      // Build a case-insensitive search across all dataset headers
      query.$or = dataset.headers.map((header: string) => ({
        [`data.${header}`]: { $regex: search, $options: 'i' }
      }));
    }

    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      Row.find(query).sort({ rowIndex: 1 }).skip(skip).limit(limit).lean(),
      Row.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      rows: rows.map((r) => r.data),
      total,
      page,
      totalPages
    });
  } catch (error) {
    console.error('Failed to fetch dataset rows:', error);
    return NextResponse.json({ error: 'Failed to fetch rows' }, { status: 500 });
  }
}
