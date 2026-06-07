'use client';

import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LabelList
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { useMemo, useEffect } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import {
  Database, TrendingUp, Activity, Layers, CheckCircle2,
  AlertTriangle, BarChart3, Sun, Moon, Printer
} from 'lucide-react'
import { useStore as useDashboardStore } from '@/lib/store'
import type { DatasetMeta } from '@/types'
import ChartCard from '@/components/dashboard/ChartCard'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton'

const fetcher = (url: string) => fetch(url).then(r => r.json())

// Auto-detect numeric columns
function getNumericCols(rows: Record<string, unknown>[], headers: string[]): string[] {
  return headers.filter(h => rows.slice(0, 20).some(r => !isNaN(Number(r[h])) && r[h] !== ''))
}

// Auto-detect categorical columns  
function getCategoricalCols(rows: Record<string, unknown>[], headers: string[]): string[] {
  return headers.filter(h => rows.slice(0, 20).some(r => isNaN(Number(r[h])) && r[h] !== ''))
}

// Get unique values for a column (max 12)
function getUniqueValues(rows: Record<string, unknown>[], col: string): string[] {
  return Array.from(new Set(rows.map(r => String(r[col] ?? '')).filter(Boolean))).slice(0, 12)
}

// Aggregate rows by a category column
function aggregateBy(rows: Record<string, unknown>[], catCol: string, numCol: string, agg: 'sum'|'avg'|'count' = 'sum') {
  const groups: Record<string, number[]> = {}
  rows.forEach(r => {
    const key = String(r[catCol] ?? 'Other')
    const val = Number(r[numCol] ?? 0)
    if (!groups[key]) groups[key] = []
    if (!isNaN(val)) groups[key].push(val)
  })
  return Object.entries(groups).map(([name, vals]) => ({
    name,
    value: agg === 'sum' ? vals.reduce((a,b) => a+b, 0)
         : agg === 'avg' ? vals.reduce((a,b) => a+b, 0) / (vals.length || 1)
         : vals.length,
    count: vals.length,
  })).sort((a,b) => b.value - a.value)
}

// Distribution of a numeric column into buckets
function bucketize(rows: Record<string, unknown>[], col: string, buckets = 8) {
  const vals = rows.map(r => Number(r[col])).filter(v => !isNaN(v))
  if (vals.length === 0) return []
  const min = Math.min(...vals), max = Math.max(...vals)
  const size = (max - min) / buckets || 1
  const counts = Array(buckets).fill(0)
  vals.forEach(v => {
    const i = Math.min(Math.floor((v - min) / size), buckets - 1)
    counts[i]++
  })
  return counts.map((count, i) => ({
    name: `${(min + i * size).toFixed(1)}–${(min + (i+1) * size).toFixed(1)}`,
    value: count,
  }))
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
function topN(data: {name:string,value:number}[], n = 8) {
  return data.slice(0, n)
}

// Format large numbers for display
function fmt(n: number): string {
  if (n >= 1_000_000) return (n/1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n/1_000).toFixed(1) + 'K'
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

export default function DashboardPage() {
  // 1. Store reads
  const { activeDatasetId, datasets, setActiveDatasetId, setDatasets, setActiveDataset } = useDashboardStore()

  // 2. SWR fetches
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

  // 3. Memos
  const rows = useMemo(() => fetchedDataset?.rows ?? [], [fetchedDataset])
  const headers = useMemo(() => fetchedDataset?.headers ?? [], [fetchedDataset])
  const numCols = useMemo(() => getNumericCols(rows, headers), [rows, headers])
  const catCols = useMemo(() => getCategoricalCols(rows, headers), [rows, headers])

  // Primary columns for charts
  const cat0 = catCols[0] ?? headers[0] ?? 'Category'
  const cat1 = catCols[1] ?? catCols[0] ?? headers[1] ?? 'Category2'
  const num0 = numCols[0] ?? headers[1] ?? 'Value'
  const num1 = numCols[1] ?? numCols[0] ?? headers[2] ?? 'Value2'
  const num2 = numCols[2] ?? numCols[0] ?? headers[3] ?? 'Value3'

  // Pre-computed chart data
  const agg0 = useMemo(() => topN(aggregateBy(rows, cat0, num0)), [rows, cat0, num0])
  const agg1 = useMemo(() => topN(aggregateBy(rows, cat0, num1)), [rows, cat0, num1])
  const agg2 = useMemo(() => topN(aggregateBy(rows, cat1, num0)), [rows, cat1, num0])
  const countData = useMemo(() => topN(aggregateBy(rows, cat0, num0, 'count')), [rows, cat0, num0])
  const avgData = useMemo(() => topN(aggregateBy(rows, cat0, num0, 'avg')), [rows, cat0, num0])
  const distData = useMemo(() => bucketize(rows, num0), [rows, num0])
  const cumulData = useMemo(() => cumulativeSum(rows, num0), [rows, num0])

  // 4. Effects
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

  // 5. Derived state
  const isLoading = datasetsLoading || datasetLoading || insightsLoading
  const hasNoDatasets = !allDatasets || allDatasets.length === 0

  // Shared chart colors
  const COLORS = ['#6366F1','#22D3EE','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6','#F97316','#06B6D4','#84CC16','#A78BFA']

  // Shared chart style props
  const gridStyle = { stroke: 'rgba(255,255,255,0.05)', strokeDasharray: '3 3' }
  const axisStyle = { fill: 'var(--text-muted)', fontSize: 11 }
  const tooltipStyle = {
    contentStyle: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text)' },
    cursor: { fill: 'rgba(255,255,255,0.03)' }
  }

  // 6. Empty state
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

  // 7. Loading skeleton
  if (isLoading) return <DashboardSkeleton />

  // 8. Main render
  return (
    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.22 }} className="p-5 space-y-5">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        {/* Dataset pill selector */}
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
          { label: 'Total Records', value: fmt(rows.length), icon: Database, color: '#6366F1', change: null },
          { label: `Total ${num0}`, value: fmt(agg0.reduce((a,b) => a + b.value, 0)), icon: TrendingUp, color: '#10B981', change: null },
          { label: `Avg ${num0}`, value: fmt(avgData[0]?.value ?? 0), icon: Activity, color: '#22D3EE', change: null },
          { label: 'Categories', value: fmt(countData.length), icon: Layers, color: '#F59E0B', change: null },
          { label: 'Data Quality', value: `${Math.round(Object.values(insights?.dataQuality ?? {}).reduce((a: number, b) => a + (b as number), 0) / Math.max(Object.keys(insights?.dataQuality ?? {}).length, 1))}%`, icon: CheckCircle2, color: '#8B5CF6', change: null },
        ].map((kpi, i) => (
          <motion.div key={i}
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.07 }}
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

      {/* ── ROW 2: Main Distribution (60%) + Donut (40%) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Bar Chart — Primary Distribution */}
        <ChartCard title={`${num0} by ${cat0}`} className="lg:col-span-3">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={agg0} margin={{ top:4, right:8, left:0, bottom:4 }}>
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
              <Bar dataKey="value" fill="url(#barG1)" radius={[4,4,0,0]} isAnimationActive animationDuration={700} animationEasing="ease-out" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Donut — Category Breakdown */}
        <ChartCard title={`${cat0} Breakdown`} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={agg0} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} isAnimationActive animationDuration={700}>
                {agg0.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          {/* Custom legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 px-1">
            {agg0.slice(0,6).map((d,i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-text-muted">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="truncate max-w-[80px]">{d.name}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* ── ROW 3: Line Chart + Horizontal Bar ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Area / Trend Line */}
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

        {/* Horizontal Bar — Ranked */}
        <ChartCard title={`Top ${cat0} Rankings`}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={agg0.slice(0,8)} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid {...gridStyle} horizontal={false} />
              <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} width={80} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" fill="#22D3EE" radius={[0,4,4,0]} isAnimationActive animationDuration={700}>
                <LabelList dataKey="value" position="right" style={{ fill: 'var(--text-muted)', fontSize: 10 }} formatter={(v: any) => fmt(Number(v))} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── ROW 4: Stacked Bar + Grouped Bar ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stacked Bar */}
        <ChartCard title={`${num0} vs ${num1} by ${cat0}`}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={agg0.slice(0,8)}>
              <CartesianGrid {...gridStyle} vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
              <Bar dataKey="value" name={num0} stackId="s" fill="#6366F1" radius={[0,0,0,0]} isAnimationActive animationDuration={700} />
              <Bar dataKey="count" name="Count" stackId="s" fill="#22D3EE" radius={[4,4,0,0]} isAnimationActive animationDuration={700} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Grouped Bar — two metrics side by side */}
        <ChartCard title={`${num0} vs Count Comparison`}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={agg0.slice(0,6)}>
              <CartesianGrid {...gridStyle} vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
              <Bar dataKey="value" name={num0} fill="#6366F1" radius={[4,4,0,0]} isAnimationActive animationDuration={700} />
              <Bar dataKey="count" name="Count" fill="#10B981" radius={[4,4,0,0]} isAnimationActive animationDuration={700} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── ROW 5: Scatter + Radar + Pie (3 equal) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Scatter Plot */}
        <ChartCard title={`${num0} vs ${num1} Scatter`}>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey={num0} name={num0} tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis dataKey={num1} name={num1} tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={rows.slice(0,100)} fill="#6366F1" fillOpacity={0.7} isAnimationActive animationDuration={700} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Radar Chart */}
        <ChartCard title={`${cat0} Radar`}>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={agg0.slice(0,8)}>
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <Radar dataKey="value" stroke="#6366F1" fill="#6366F1" fillOpacity={0.2} isAnimationActive animationDuration={700} />
              <Tooltip {...tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Pie Chart (no hole) */}
        <ChartCard title={`${cat0} Share`}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={agg0.slice(0,6)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} isAnimationActive animationDuration={700}>
                {agg0.slice(0,6).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── ROW 6: Distribution Histogram + Cumulative Line ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Histogram / Distribution */}
        <ChartCard title={`${num0} Distribution`}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={distData}>
              <CartesianGrid {...gridStyle} vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" fill="#8B5CF6" radius={[4,4,0,0]} isAnimationActive animationDuration={700} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Cumulative Volume Line */}
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

      {/* ── ROW 7: Top Performers List + Recent Data Feed ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Performers — progress bar list */}
        <ChartCard title={`Top ${cat0} by ${num0}`}>
          <div className="space-y-3">
            {agg0.slice(0,8).map((item, i) => {
              const max = agg0[0]?.value || 1
              const pct = (item.value / max) * 100
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-text-muted w-4 text-right flex-shrink-0">{i+1}</span>
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

        {/* Recent Data Feed — last 10 rows */}
        <ChartCard title="Recent Records">
          <div className="space-y-0 overflow-hidden">
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(headers.length, 4)}, 1fr)` }}>
              {headers.slice(0,4).map((h: string) => (
                <p key={h} className="text-[10px] font-mono uppercase tracking-wider text-text-muted pb-2 border-b border-border">{h}</p>
              ))}
            </div>
            {rows.slice(-10).reverse().map((row: any, i: number) => (
              <motion.div key={i} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: i * 0.03 }}
                className="grid gap-2 py-2 border-b border-border hover:bg-bg-hover transition-colors"
                style={{ gridTemplateColumns: `repeat(${Math.min(headers.length, 4)}, 1fr)` }}
              >
                {headers.slice(0,4).map((h: string) => (
                  <p key={h} className="text-xs text-text-muted truncate" title={String(row[h] ?? '')}>
                    {String(row[h] ?? '—')}
                  </p>
                ))}
              </motion.div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* ── ROW 8: Average by Category + Count by Category ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Average Bar */}
        <ChartCard title={`Average ${num0} by ${cat0}`}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={avgData}>
              <CartesianGrid {...gridStyle} vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" fill="#10B981" radius={[4,4,0,0]} isAnimationActive animationDuration={700} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Count Bar */}
        <ChartCard title={`Record Count by ${cat0}`}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={countData}>
              <CartesianGrid {...gridStyle} vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="count" fill="#F59E0B" radius={[4,4,0,0]} isAnimationActive animationDuration={700} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── ROW 9: Second Category Analysis + Dual Axis ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Second category */}
        {catCols.length > 1 ? (
          <ChartCard title={`${num0} by ${cat1}`}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={agg2}>
                <CartesianGrid {...gridStyle} vertical={false} />
                <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" fill="#EC4899" radius={[4,4,0,0]} isAnimationActive animationDuration={700} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        ) : <div />}

        {/* Dual axis — value + count */}
        <ChartCard title={`${num0} & Count Trend`}>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={agg0.slice(0,10)}>
              <CartesianGrid {...gridStyle} vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Area yAxisId="left" type="monotone" dataKey="value" fill="#6366F140" stroke="#6366F1" strokeWidth={2} isAnimationActive animationDuration={700} />
              <Line yAxisId="right" type="monotone" dataKey="count" stroke="#22D3EE" strokeWidth={2} dot={false} isAnimationActive animationDuration={700} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

    </motion.div>
  )
}
