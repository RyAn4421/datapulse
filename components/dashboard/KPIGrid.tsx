import { motion } from 'framer-motion';
import { KPICard } from './KPICard';
import { Database, Filter, Hash, TrendingUp, Activity, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useInsights } from '@/hooks/useInsights';

interface KPIGridProps {
  rows?: any[];
}

export function KPIGrid({ rows = [] }: KPIGridProps) {
  const { activeDatasetId } = useStore();
  const { insights, isLoading } = useInsights(activeDatasetId);

  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.07,
      },
    },
  };

  if (isLoading || !activeDatasetId) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-void-800/50 border border-void-500/30 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  // Card 1: Total Records
  const totalRows = insights?.rowCount || 0;

  // Pick first numeric col for sum/avg
  const numericCols = insights?.numericCols || [];
  const firstNumCol = numericCols.length > 0 ? numericCols[0] : null;

  // Card 2: Total Sum
  const sumValue = firstNumCol && insights?.stats?.[firstNumCol] ? insights.stats[firstNumCol].sum : 0;

  // Card 3: Average
  const avgValue = firstNumCol && insights?.stats?.[firstNumCol] ? insights.stats[firstNumCol].avg : 0;

  // Card 4: Data Quality Average
  const dataQuality = insights?.dataQuality || {};
  const qualityKeys = Object.keys(dataQuality);
  const dataQualityAvg = qualityKeys.length > 0
    ? Math.round(qualityKeys.reduce((acc, col) => acc + (dataQuality[col] || 0), 0) / qualityKeys.length)
    : 100;

  // Generate sparkline from the first 12 row values of that column
  const getSparklineData = (col: string | null) => {
    if (!col || !rows || rows.length === 0) {
      return [0, 4, 3, 6, 5, 8, 7, 10];
    }
    return rows.slice(0, 12).map((r) => {
      const val = Number(r[col]);
      return Number.isFinite(val) ? val : 0;
    });
  };

  const first12NumericVals = getSparklineData(firstNumCol);
  
  const recordsSparkline = rows && rows.length > 0 
    ? rows.slice(0, 12).map((_, idx) => idx + 1)
    : [1, 2, 3, 4, 5, 6, 7, 8];

  const qualitySparkline = rows && rows.length > 0
    ? rows.slice(0, 12).map((r, idx) => {
        // Render simple completeness simulation or 100s
        const nullCount = Object.values(r).filter(v => v === null || v === undefined || v === '').length;
        const totalFields = Object.keys(r).length || 1;
        return Math.round(((totalFields - nullCount) / totalFields) * 100);
      })
    : [100, 100, 100, 100, 100, 100];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
    >
      <KPICard
        title="Total Records"
        icon={Database}
        value={totalRows}
        change={0}
        trendData={recordsSparkline}
      />
      <KPICard
        title={firstNumCol ? `Total ${firstNumCol}` : 'Total Sum'}
        icon={TrendingUp}
        value={sumValue}
        change={0}
        trendData={first12NumericVals}
      />
      <KPICard
        title={firstNumCol ? `Average ${firstNumCol}` : 'Average'}
        icon={Activity}
        value={avgValue.toFixed(2)}
        change={0}
        trendData={first12NumericVals}
      />
      <KPICard
        title="Data Quality"
        icon={CheckCircle2}
        value={dataQualityAvg}
        suffix="%"
        change={0}
        trendData={qualitySparkline}
      />
    </motion.div>
  );
}
