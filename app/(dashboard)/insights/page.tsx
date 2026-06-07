'use client';

import { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  AlertTriangle, 
  Award, 
  BarChart3, 
  CheckCircle2, 
  Database, 
  Layers, 
  TrendingUp, 
  ArrowRight,
  Printer
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { useStore as useDashboardStore } from '@/lib/store';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const fetcher = (url: string) => fetch(url).then(r => r.json())

function fmt(n: number): string {
  if (n >= 1_000_000) return (n/1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n/1_000).toFixed(1) + 'K'
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

export default function InsightsPage() {
  const router = useRouter();
  const { activeDatasetId, datasets, setActiveDatasetId, setDatasets, setActiveDataset } = useDashboardStore()

  const { data: allDatasets, isLoading: datasetsLoading } = useSWR('/api/datasets', fetcher, {
    revalidateOnFocus: false, dedupingInterval: 30000
  })
  const { data: fetchedDataset, isLoading: datasetLoading } = useSWR(
    activeDatasetId ? `/api/datasets/${activeDatasetId}` : null, fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )
  const { data: insights, isLoading: insightsLoading } = useSWR(
    activeDatasetId ? `/api/insights/${activeDatasetId}` : null, fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )

  useEffect(() => {
    if (allDatasets) setDatasets(allDatasets)
  }, [allDatasets]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!activeDatasetId && allDatasets?.length > 0) {
      setActiveDatasetId(allDatasets[0]._id)
    }
  }, [activeDatasetId, allDatasets]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (fetchedDataset) setActiveDataset(fetchedDataset)
  }, [fetchedDataset]) // eslint-disable-line react-hooks/exhaustive-deps

  const isLoading = datasetsLoading || datasetLoading || insightsLoading
  const hasNoDatasets = !allDatasets || allDatasets.length === 0

  if (!isLoading && hasNoDatasets) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <Database size={48} className="text-text-muted mb-4 opacity-40 animate-pulse" />
        <h2 className="text-xl font-serif text-text font-semibold mb-2">No dataset selected</h2>
        <p className="text-text-muted text-sm mb-6 max-w-sm">Please select or upload a dataset to view dynamic insights and column quality.</p>
        <Link href="/import">
          <motion.button 
            whileTap={{ scale: 0.97 }} 
            className="h-10 px-5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium flex items-center gap-2 transition-colors" 
          >
            Import Data <ArrowRight className="w-4 h-4" />
          </motion.button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        <div className="h-8 w-48 bg-bg-card rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-28 bg-bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-48 bg-bg-card border border-border rounded-xl animate-pulse" />
      </div>
    );
  }

  const rows = fetchedDataset?.rows ?? []
  const headers = fetchedDataset?.headers ?? []
  const dataQuality = insights?.dataQuality ?? {}
  const stats = insights?.stats ?? {}
  const topCategories = insights?.topCategories ?? {}
  
  const totalRecords = rows.length;
  const numColsCount = Object.keys(stats).length;
  const catColsCount = Object.keys(topCategories).length;
  const totalCols = headers.length;
  
  const totalMissing = Object.values(dataQuality).reduce((acc: number, val: any) => {
    return acc + (totalRecords - Math.round(totalRecords * (val as number) / 100))
  }, 0)

  const totalOutliers = Object.values(stats).reduce((acc: number, s: any) => acc + (s.outliers ?? 0), 0)

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }} className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-text">Data Insights</h1>
          <p className="text-text-muted text-sm mt-1">Statistical analysis of your dataset</p>
        </div>
        <button 
          onClick={() => window.print()} 
          className="flex items-center gap-2 px-3 py-1.5 bg-bg-card border border-border rounded-lg text-sm text-text-muted hover:text-text transition-colors"
        >
          <Printer size={16} /> Export Report
        </button>
      </div>

      {/* ── SECTION 1: Overview Stats Row (6 cards) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {[
          { label: 'Total Records', value: fmt(totalRecords), icon: Database, color: '#6366F1' },
          { label: 'Columns', value: fmt(totalCols), icon: Layers, color: '#10B981' },
          { label: 'Numeric Cols', value: fmt(numColsCount), icon: Activity, color: '#22D3EE' },
          { label: 'Categorical Cols', value: fmt(catColsCount), icon: Award, color: '#8B5CF6' },
          { label: 'Missing Values', value: fmt(totalMissing), icon: AlertTriangle, color: '#F59E0B' },
          { label: 'Outliers', value: fmt(totalOutliers), icon: TrendingUp, color: '#EF4444' },
        ].map((stat, index) => {
            const Icon = stat.icon;
            return (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="relative bg-bg-card border border-border rounded-xl p-4 overflow-hidden group">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <Icon className="w-5 h-5 mb-4 group-hover:scale-110 transition-transform" style={{ color: stat.color }} />
                    <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest leading-tight">{stat.label}</p>
                    <p className="text-xl font-serif font-semibold text-text truncate mt-1">{stat.value}</p>
                </motion.div>
            );
        })}
      </div>

      {/* ── SECTION 2: Data Quality per Column ── */}
      <div className="bg-bg-card border border-border rounded-xl p-5 mb-5">
        <h2 className="text-sm font-semibold text-text mb-4">Column Completeness</h2>
        <div className="space-y-3">
          {Object.entries(dataQuality).map(([column, value], index) => {
              const pct = Number(value);
              const color = pct >= 90 ? 'bg-success' : pct >= 70 ? 'bg-warning' : 'bg-danger';
              return (
                  <div key={column} className="bg-bg-hover p-3 rounded-lg border border-border">
                      <div className="flex justify-between text-xs mb-2 font-mono">
                          <span className="text-text truncate">{column}</span>
                          <span className="text-text font-medium">{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-bg overflow-hidden">
                          <motion.div 
                              className={`h-full ${color}`} 
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }} 
                              transition={{ duration: 0.8, delay: index * 0.03, ease: 'easeOut' }} 
                          />
                      </div>
                  </div>
              );
          })}
        </div>
      </div>

      {/* ── SECTION 3: Per-Column Statistics ── */}
      <div className="bg-bg-card border border-border rounded-xl p-5 mb-5">
        <h2 className="text-sm font-semibold text-text mb-4">Column Statistics</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {['Column', 'Type', 'Min', 'Max', 'Average', 'Sum', 'Std Dev', 'Outliers'].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-mono text-text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats).map(([col, stat]: [string, any]) => (
                <tr key={col} className="border-b border-border hover:bg-bg-hover">
                  <td className="px-3 py-2 font-mono text-accent">{col}</td>
                  <td className="px-3 py-2 text-text-muted">Numeric</td>
                  <td className="px-3 py-2 text-text">{fmt(stat.min)}</td>
                  <td className="px-3 py-2 text-text">{fmt(stat.max)}</td>
                  <td className="px-3 py-2 text-text">{fmt(stat.avg)}</td>
                  <td className="px-3 py-2 text-text">{fmt(stat.sum)}</td>
                  <td className="px-3 py-2 text-text-muted">{fmt(stat.std)}</td>
                  <td className="px-3 py-2">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-mono ${stat.outliers > 0 ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                      {stat.outliers}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SECTION 4: Category Value Counts ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {Object.entries(topCategories).slice(0,4).map(([col, counts]: [string, any]) => {
          const data = Object.entries(counts).map(([name, value]) => ({ name, value: value as number }))
          return (
            <div key={col} className="bg-bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-text mb-3">{col} Values</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text)' }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="value" fill="#6366F1" radius={[4,4,0,0]} isAnimationActive animationDuration={700} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )
        })}
      </div>

      {/* ── SECTION 5: Smart Recommendations ── */}
      <div className="bg-bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-text mb-4">Smart Recommendations</h2>
        <div className="space-y-3">
          {[
            { icon: BarChart3, color: '#6366F1', title: `Best chart for your data`, desc: `Based on your columns, a ${insights?.suggestedChart ?? 'bar'} chart will show the most useful patterns.`, action: 'Open Chart Builder', href: '/explore' },
            { icon: AlertTriangle, color: '#F59E0B', title: 'Outliers detected', desc: `${totalOutliers} outlier values found. Check your data for data entry errors.`, action: null, href: null },
            { icon: CheckCircle2, color: '#10B981', title: 'Data completeness', desc: `Your dataset is ${Math.round(Object.values(dataQuality).reduce((a: number, b) => a + (b as number), 0) / Math.max(Object.keys(dataQuality).length, 1))}% complete. ${Object.values(dataQuality).some((v) => (v as number) < 90) ? 'Some columns have missing values.' : 'All columns look great!'}`, action: null, href: null },
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-bg-hover border border-border">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: tip.color + '20' }}>
                <tip.icon size={14} style={{ color: tip.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text">{tip.title}</p>
                <p className="text-xs text-text-muted mt-0.5">{tip.desc}</p>
              </div>
              {tip.action && tip.href && (
                <Link href={tip.href}>
                  <button className="text-xs text-accent hover:text-accent-hover font-medium whitespace-nowrap transition-colors">{tip.action} →</button>
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

    </motion.div>
  )
}
