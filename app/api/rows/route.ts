import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { Row } from '@/lib/models/Row';
import { Dataset } from '@/lib/models/Dataset';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const datasetId = searchParams.get('datasetId');
    
    if (!datasetId) {
      return NextResponse.json({ error: 'datasetId is required' }, { status: 400 });
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 500);
    const search = searchParams.get('search');
    const sortCol = searchParams.get('sortCol');
    const sortDir = searchParams.get('sortDir');
    const filter = searchParams.get('filter');

    await dbConnect();
    
    // Verify dataset ownership first
    const dataset = await Dataset.findOne({ _id: datasetId, userId: (session.user as any).id });
    if (!dataset) {
         return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    const query: any = { datasetId };

    if (search) {
        query['data.$**'] = { $regex: search, $options: 'i' };
    }

    if (filter) {
        try {
            const filterObj = JSON.parse(filter);
            for (const [key, value] of Object.entries(filterObj)) {
                query[`data.${key}`] = value;
            }
        } catch (e) {
            // ignore invalid filter json
        }
    }

    let sort: any = { rowIndex: 1 };
    if (sortCol) {
        sort = { [`data.${sortCol}`]: sortDir === 'desc' ? -1 : 1 };
    }

    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
        Row.find(query).sort(sort).skip(skip).limit(limit).lean(),
        Row.countDocuments(query)
    ]);

    return NextResponse.json({
        rows: rows.map(r => r.data),
        total,
        page,
        pages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch rows' }, { status: 500 });
  }
}
