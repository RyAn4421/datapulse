'use client';

import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  ScatterChart, Scatter, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts'
import { motion } from 'framer-motion'
import { useMemo, useEffect } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import {
  Database, TrendingUp, Activity, Layers, CheckCircle2,
  Printer, FileText
} from 'lucide-react'
import { useStore as useDashboardStore } from '@/lib/store'
import type { DatasetMeta } from '@/types'
import ChartCard from '@/components/dashboard/ChartCard'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton'
import AlertPanel from '@/components/dashboard/AlertPanel'
import { calculateQualityScore } from '@/lib/analytics/quality-score'
import { generateSmartAlerts } from '@/lib/analytics/alerts'

const fetcher = (url: string) => fetch(url).then(r => r.json())

// Auto-detect numeric columns
function getNumericCols(rows: Record<string, unknown>[], headers: string[]): string[] {
  return headers.filter(h => rows.slice(0, 20).some(r => !isNaN(Number(r[h])) && r[h] !== ''))
}

// Auto-detect categorical columns  
function getCategoricalCols(rows: Record<string, unknown>[], headers: string[]): string[] {
  return headers.filter(h => rows.slice(0, 20).some(r => isNaN(Number(r[h])) && r[h] !== ''))
}

// Aggregate rows by a category column
function aggregateBy(rows: Record<string, unknown>[], catCol: string, numCol: string, agg: 'sum' | 'avg' | 'count' = 'sum') {
  const groups: Record<string, number[]> = {}
  rows.forEach(r => {
    const key = String(r[catCol] ?? 'Other')
    const val = Number(r[numCol] ?? 0)
    if (!groups[key]) groups[key] = []
    if (!isNaN(val)) groups[key].push(val)
  })
  return Object.entries(groups).map(([name, vals]) => ({
    name,
    value: agg === 'sum' ? vals.reduce((a, b) => a + b, 0)
      : agg === 'avg' ? vals.reduce((a, b) => a + b, 0) / (vals.length || 1)
        : vals.length,
    count: vals.length,
  })).sort((a, b) => b.value - a.value)
}

// Running total (cumulative sum)
function cumulativeSum(rows: Record<string, unknown>[], col: string) {
  let total = 0
  return rows.map((r, i) => {
    total += Number(r[col] ?? 0)
    return { name: String(i + 1), value: total }
  })
}

// Top N rows by a numeric column
function topN(data: { name: string, value: number, count?: number }[], n = 8) {
  return data.slice(0, n)
}

// Format large numbers for display
function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

export default function DashboardPage() {
  const { activeDatasetId, datasets, setActiveDatasetId, setDatasets, setActiveDataset } = useDashboardStore()

  const { data: allDatasets, isLoading: datasetsLoading } = useSWR('/api/datasets', fetcher, {
    revalidateOnFocus: false, dedupingInterval: 30000
  })
  const { data: fetchedDataset, isLoading: datasetLoading } = useSWR(
    activeDatasetId ? `/api/datasets/${activeDatasetId}` : null, fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )

  const rows = useMemo(() => fetchedDataset?.rows ?? [], [fetchedDataset])
  const headers = useMemo(() => fetchedDataset?.headers ?? [], [fetchedDataset])
  const numCols = useMemo(() => getNumericCols(rows, headers), [rows, headers])
  const catCols = useMemo(() => getCategoricalCols(rows, headers), [rows, headers])

  // Analytics
  const quality = useMemo(() => calculateQualityScore(rows, headers), [rows, headers])
  const alerts = useMemo(() => generateSmartAlerts(rows, headers), [rows, headers])

  const cat0 = catCols[0] ?? headers[0] ?? 'Category'
  const num0 = numCols[0] ?? headers[1] ?? 'Value'
  const num1 = numCols[1] ?? numCols[0] ?? headers[2] ?? 'Value2'

  const agg0 = useMemo(() => topN(aggregateBy(rows, cat0, num0)), [rows, cat0, num0])
  const countData = useMemo(() => topN(aggregateBy(rows, cat0, num0, 'count')), [rows, cat0, num0])
  const avgData = useMemo(() => topN(aggregateBy(rows, cat0, num0, 'avg')), [rows, cat0, num0])
  const cumulData = useMemo(() => cumulativeSum(rows, num0), [rows, num0])

  useEffect(() => {
    if (allDatasets) setDatasets(allDatasets)
  }, [allDatasets])

  useEffect(() => {
    if (!activeDatasetId && allDatasets?.length > 0) {
      setActiveDatasetId(allDatasets[0]._id)
    }
  }, [activeDatasetId, allDatasets])

  useEffect(() => {
    if (fetchedDataset) setActiveDataset(fetchedDataset)
  }, [fetchedDataset])

  const isLoading = datasetsLoading || datasetLoading
  const hasNoDatasets = !allDatasets || allDatasets.length === 0

  const COLORS = ['#6366F1', '#22D3EE', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6']
  const gridStyle = { stroke: 'rgba(255,255,255,0.05)', strokeDasharray: '3 3' }
  const axisStyle = { fill: 'var(--text-muted)', fontSize: 11 }
  const tooltipStyle = {
    contentStyle: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text)' },
    cursor: { fill: 'rgba(255,255,255,0.03)' }
  }

  if (!isLoading && hasNoDatasets) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-accent-subtle flex items-center justify-center mb-4">
          <Database size={28} className="text-accent" />
        </div>
        <p className="text-text font-semibold text-lg mb-2">No data yet</p>
        <p className="text-text-muted text-sm mb-6 max-w-xs">Upload a CSV or Excel file to see your dashboard come to life</p>
        <Link href="/import">
          <motion.button whileTap={{ scale: 0.97 }} className="bg-accent hover:bg-accent-hover text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors">
            Import Your Data
          </motion.button>
        </Link>
      </div>
    )
  }

  if (isLoading) return <DashboardSkeleton />

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }} className="p-5 space-y-5">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        {allDatasets?.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar flex-1">
            {allDatasets.map((ds: DatasetMeta) => (
              <button key={ds._id} onClick={() => setActiveDatasetId(ds._id)}
                className={`relative px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors
                  ${activeDatasetId === ds._id ? 'text-white' : 'text-text-muted hover:text-text'}`}>
                {activeDatasetId === ds._id && (
                  <motion.div layoutId="dataset-pill" className="absolute inset-0 bg-accent rounded-full" />
                )}
                <span className="relative z-10">{ds.name}</span>
              </button>
            ))}
          </div>
        ) : <div className="flex-1" />}

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-3 py-1.5 bg-bg-card border border-border rounded-lg text-sm text-text-muted hover:text-text transition-colors"
        >
          <Printer size={16} /> Export Report
        </button>
      </div>

      {/* ── ROW 1: KPI Cards (5 cards) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Records', value: fmt(rows.length), icon: Database, color: '#6366F1' },
          { label: `Total ${num0}`, value: fmt(agg0.reduce((a, b) => a + b.value, 0)), icon: TrendingUp, color: '#10B981' },
          { label: `Avg ${num0}`, value: fmt(avgData[0]?.value ?? 0), icon: Activity, color: '#22D3EE' },
          { label: 'Categories', value: fmt(countData.length), icon: Layers, color: '#F59E0B' },
          { label: 'Data Quality', value: `${quality.score}%`, icon: CheckCircle2, color: quality.score < 70 ? '#EF4444' : '#8B5CF6' },
        ].map((kpi, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            whileHover={{ y: -3 }}
            className="bg-bg-card border border-border rounded-xl p-5 relative overflow-hidden cursor-default"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="flex items-start justify-between mb-3">
              <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest leading-tight">{kpi.label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: kpi.color + '20' }}>
                <kpi.icon size={14} style={{ color: kpi.color }} />
              </div>
            </div>
            <p className="font-serif text-3xl text-text">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ── ROW 2: Executive Summary & Alert Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-bg-card border border-border rounded-xl p-5 flex flex-col justify-center min-h-[160px]">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={18} className="text-accent" />
            <h3 className="font-semibold text-text">Executive Summary</h3>
          </div>
          <p className="text-sm text-text-muted leading-relaxed">
            {fetchedDataset?.name 
              ? `Analysis for ${fetchedDataset.name} (Grade ${quality.grade}). The dataset contains ${fmt(rows.length)} records across ${headers.length} dimensions. The primary category '${cat0}' shows notable distribution patterns across the main metric '${num0}'.` 
              : 'Generating executive summary placeholder...'}
          </p>
        </div>
        <div className="lg:col-span-1 min-h-[160px]">
          <AlertPanel alerts={alerts} isLoading={datasetLoading} />
        </div>
      </div>

      {/* ── ROW 3: Main Distribution (60%) + Donut (40%) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <ChartCard title={`${num0} by ${cat0}`} className="lg:col-span-3">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={agg0} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id="barG1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridStyle} vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" fill="url(#barG1)" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={700} animationEasing="ease-out" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={`${cat0} Share`} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={agg0} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} isAnimationActive animationDuration={700}>
                {agg0.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 px-1">
            {agg0.slice(0, 6).map((d, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-text-muted">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="truncate max-w-[80px]">{d.name}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* ── ROW 4: Trend Line + Stacked Bar ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title={`${num0} Trend`}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={agg0}>
              <defs>
                <linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridStyle} vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={2} fill="url(#areaG)" isAnimationActive animationDuration={700} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={`${num0} vs Count by ${cat0}`}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={agg0.slice(0, 8)}>
              <CartesianGrid {...gridStyle} vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
              <Bar dataKey="value" name={num0} stackId="s" fill="#6366F1" radius={[0, 0, 0, 0]} isAnimationActive animationDuration={700} />
              <Bar dataKey="count" name="Count" stackId="s" fill="#22D3EE" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={700} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── ROW 5: Scatter + Cumulative ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title={`${num0} vs ${num1} Correlation`}>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey={num0} name={num0} tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis dataKey={num1} name={num1} tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={rows.slice(0, 100)} fill="#6366F1" fillOpacity={0.7} isAnimationActive animationDuration={700} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={`Cumulative ${num0}`}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={cumulData}>
              <defs>
                <linearGradient id="lineG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridStyle} vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="value" stroke="#22D3EE" strokeWidth={2} dot={false} isAnimationActive animationDuration={700} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── ROW 6: Top Performers + Recent Records ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title={`Top ${cat0} by ${num0}`}>
          <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
            {agg0.slice(0, 8).map((item, i) => {
              const max = agg0[0]?.value || 1
              const pct = (item.value / max) * 100
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-text-muted w-4 text-right flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-text truncate">{item.name}</span>
                      <span className="text-xs font-mono text-text-muted ml-2 flex-shrink-0">{fmt(item.value)}</span>
                    </div>
                    <div className="h-1.5 bg-bg-hover rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: COLORS[i % COLORS.length] }}
                        initial={{ width: 0 }}
                        animate={{ width: pct + '%' }}
                        transition={{ duration: 0.8, delay: i * 0.05, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </ChartCard>

        <ChartCard title="Recent Records">
          <div className="space-y-0 overflow-hidden max-h-[200px] overflow-y-auto custom-scrollbar">
            <div className="grid gap-2 sticky top-0 bg-bg-card z-10" style={{ gridTemplateColumns: `repeat(${Math.min(headers.length, 4)}, 1fr)` }}>
              {headers.slice(0, 4).map((h: string) => (
                <p key={h} className="text-[10px] font-mono uppercase tracking-wider text-text-muted pb-2 border-b border-border">{h}</p>
              ))}
            </div>
            {rows.slice(-8).reverse().map((row: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="grid gap-2 py-2 border-b border-border hover:bg-bg-hover transition-colors"
                style={{ gridTemplateColumns: `repeat(${Math.min(headers.length, 4)}, 1fr)` }}
              >
                {headers.slice(0, 4).map((h: string) => (
                  <p key={h} className="text-xs text-text-muted truncate" title={String(row[h] ?? '')}>
                    {String(row[h] ?? '—')}
                  </p>
                ))}
              </motion.div>
            ))}
          </div>
        </ChartCard>
      </div>

    </motion.div>
  )
}
