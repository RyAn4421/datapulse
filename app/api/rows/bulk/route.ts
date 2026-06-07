import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { Row } from '@/lib/models/Row';
import { Dataset } from '@/lib/models/Dataset';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { datasetId, rows } = await request.json();

    if (!datasetId || !Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    await dbConnect();
    
    // Verify dataset ownership
    const dataset = await Dataset.findOne({ _id: datasetId, userId: (session.user as any).id });
    if (!dataset) {
        return NextResponse.json({ error: 'Dataset not found or unauthorized' }, { status: 404 });
    }

    const docsToInsert = rows.map((r, i) => ({
        datasetId,
        userId: (session.user as any).id,
        data: r,
        rowIndex: i
    }));

    // ordered: false allows parallel insertion and continues even if some fail
    const result = await Row.insertMany(docsToInsert, { ordered: false });

    return NextResponse.json({ inserted: result.length, failed: docsToInsert.length - result.length }, { status: 201 });
  } catch (error: any) {
     if (error.code === 11000) {
         // Duplicate key error from insertMany with ordered:false
          return NextResponse.json({ 
              inserted: error.result?.nInserted || 0,
              failed: (error.writeErrors?.length) || 0 
          }, { status: 201 });
     }
    return NextResponse.json({ error: 'Failed to insert rows' }, { status: 500 });
  }
}
