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
    const datasetId = params.id;

    const dataset = await Dataset.findById(datasetId);
    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    if (dataset.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all rows to compute stats dynamically
    const dbRows = await Row.find({ datasetId }).sort({ rowIndex: 1 }).lean();
    const totalRows = dbRows.length;
    const rows = dbRows.map((r) => r.data);

    const numericCols = dataset.numericCols || [];
    const categoricalCols = dataset.categoricalCols || [];
    const headers = dataset.headers || [];

    const stats: any = {};
    const topCategories: any = {};
    const dataQuality: any = {};

    // 1. Compute stats for numeric columns
    numericCols.forEach((col: string) => {
      const vals = rows
        .map((r) => r[col])
        .filter((v) => v !== null && v !== undefined && v !== '' && !Number.isNaN(Number(v)))
        .map((v) => Number(v));

      const count = vals.length;
      const completeness = totalRows > 0 ? (count / totalRows) * 100 : 0;
      dataQuality[col] = Math.round(completeness);

      if (count === 0) {
        stats[col] = { sum: 0, avg: 0, min: 0, max: 0, std: 0, outliers: 0 };
        return;
      }

      const sum = vals.reduce((a, b) => a + b, 0);
      const avg = sum / count;
      const min = Math.min(...vals);
      const max = Math.max(...vals);

      // Population Standard deviation
      const variance = vals.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / count;
      const std = Math.sqrt(variance);

      // Outliers: values beyond 2 standard deviations from average
      let outliers = 0;
      if (std > 0) {
        outliers = vals.filter((v) => Math.abs(v - avg) > 2 * std).length;
      }

      stats[col] = { sum, avg, min, max, std, outliers };
    });

    // 2. Compute topCategories for categorical columns
    categoricalCols.forEach((col: string) => {
      const counts: Record<string, number> = {};
      let validCount = 0;

      rows.forEach((r) => {
        const val = r[col];
        if (val !== null && val !== undefined && val !== '') {
          const key = String(val);
          counts[key] = (counts[key] || 0) + 1;
          validCount++;
        }
      });

      topCategories[col] = counts;

      const completeness = totalRows > 0 ? (validCount / totalRows) * 100 : 0;
      dataQuality[col] = Math.round(completeness);
    });

    // Fill quality for remaining header fields
    headers.forEach((col: string) => {
      if (dataQuality[col] === undefined) {
        const validCount = rows.filter(
          (r) => r[col] !== null && r[col] !== undefined && r[col] !== ''
        ).length;
        dataQuality[col] = totalRows > 0 ? Math.round((validCount / totalRows) * 100) : 0;
      }
    });

    // 3. Suggested chart logic
    let suggestedChart: 'bar' | 'line' | 'scatter' | 'pie' | 'radar' = 'bar';

    if (numericCols.length > 2) {
      suggestedChart = 'scatter';
    } else if (categoricalCols.length === 1 && numericCols.length === 1) {
      const catCol = categoricalCols[0];
      const uniqueCats = Object.keys(topCategories[catCol] || {}).length;
      if (uniqueCats > 0 && uniqueCats <= 8) {
        suggestedChart = 'pie';
      }
    } else if (numericCols.length === 1) {
      const hasTimeCol = headers.some((h: string) => {
        const lower = h.toLowerCase();
        return lower.includes('date') || lower.includes('year') || lower.includes('month') || lower.includes('time');
      });
      if (hasTimeCol) {
        suggestedChart = 'line';
      }
    } else if (numericCols.length > 1 && categoricalCols.length > 0) {
      const catCol = categoricalCols[0];
      const uniqueCats = Object.keys(topCategories[catCol] || {}).length;
      if (uniqueCats > 8) {
        suggestedChart = 'radar';
      }
    }

    return NextResponse.json({
      numericCols,
      categoricalCols,
      stats,
      topCategories,
      dataQuality,
      suggestedChart,
      rowCount: totalRows,
      colCount: headers.length,
    });
  } catch (error) {
    console.error('Failed to generate insights:', error);
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
  }
}
