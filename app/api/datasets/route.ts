import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { Dataset } from '@/lib/models/Dataset';
import { Row } from '@/lib/models/Row';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
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
    
    // Return all datasets for the logged-in user, fields: _id, name, source, rowCount, createdAt
    const datasets = await Dataset.find({ userId })
      .select('_id name source rowCount createdAt')
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json(datasets);
  } catch (error) {
    console.error('Failed to fetch datasets:', error);
    return NextResponse.json({ error: 'Failed to fetch datasets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id || session.user.email;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: User identifier missing' }, { status: 401 });
    }

    const body = await request.json();
    const { name, source, headers, rows } = body;

    if (!name || !headers || !rows) {
      return NextResponse.json({ error: 'Missing name, headers, or rows' }, { status: 400 });
    }

    const inferredRows = Array.isArray(rows) ? rows : [];
    
    // Infer columns
    const inferredNumericCols = headers.filter((header: string) =>
      inferredRows.some((row: Record<string, any>) => {
        const val = row[header];
        return typeof val === 'number' || (typeof val === 'string' && val.trim() !== '' && !Number.isNaN(Number(val)));
      })
    );
    const inferredCategoricalCols = headers.filter((header: string) => !inferredNumericCols.includes(header));

    await connectDB();

    const dataset = await Dataset.create({
      userId,
      name,
      fileName: name,
      fileType: source || 'csv',
      source: source || 'csv',
      headers,
      rowCount: inferredRows.length,
      numericCols: inferredNumericCols,
      categoricalCols: inferredCategoricalCols,
      tags: [source || 'csv']
    });

    if (inferredRows.length > 0) {
      // Chunk rows insertion if dataset is large
      const rowsToInsert = inferredRows.map((row: Record<string, any>, rowIndex: number) => ({
        datasetId: dataset._id,
        userId,
        data: row,
        rowIndex,
      }));
      
      const chunkSize = 2000;
      for (let i = 0; i < rowsToInsert.length; i += chunkSize) {
        await Row.insertMany(rowsToInsert.slice(i, i + chunkSize));
      }
    }

    return NextResponse.json(dataset, { status: 201 });
  } catch (error) {
    console.error('Failed to create dataset:', error);
    return NextResponse.json({ error: 'Failed to create dataset' }, { status: 500 });
  }
}
