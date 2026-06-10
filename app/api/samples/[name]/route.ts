import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { Dataset } from '@/lib/models/Dataset';
import { Row } from '@/lib/models/Row';
import { SAMPLE_DATASETS } from '@/lib/sample-datasets';

export async function POST(
  req: NextRequest,
  { params }: { params: { name: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = params;
  const sampleData = SAMPLE_DATASETS[name];

  if (!sampleData) {
    return NextResponse.json({ error: 'Unknown sample dataset' }, { status: 404 });
  }

  await connectDB();

  const userId = (session.user as any).id || session.user.email;

  // Create dataset document
  const numericCols = sampleData.headers.filter((h: string) =>
    sampleData.rows.slice(0, 5).some((r: any) => !isNaN(Number(r[h])) && r[h] !== '')
  );
  const categoricalCols = sampleData.headers.filter(
    (h: string) => !numericCols.includes(h)
  );

  const dataset = await Dataset.create({
    userId,
    name: sampleData.name,
    description: sampleData.description,
    fileName: `${name}-sample.json`,
    fileType: 'json',
    source: 'sample',
    headers: sampleData.headers,
    rowCount: sampleData.rows.length,
    numericCols,
    categoricalCols,
    tags: ['sample'],
    // Pre-cache the AI summary so no Groq call is needed
    aiSummary: sampleData.executiveSummary,
    summaryGeneratedAt: new Date(),
  });

  // Bulk insert rows
  const rowDocs = sampleData.rows.map((row: any) => ({
    datasetId: dataset._id,
    userId,
    data: row,
  }));

  await Row.insertMany(rowDocs);

  return NextResponse.json({
    _id: dataset._id,
    name: dataset.name,
    rowCount: dataset.rowCount,
    headers: dataset.headers,
    sample: true,
  }, { status: 201 });
}
