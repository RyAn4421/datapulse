'use client'
import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GitCompare, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, LineChart, Line
} from 'recharts'
import useSWR from 'swr'
import SimpleDropdown from '@/components/ui/SimpleDropdown'
import { prepareChartData } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then(r => r.json())

function getNumericCols(rows: Record<string, unknown>[], headers: string[]): string[] {
  return headers.filter(h => rows.slice(0,20).some(r => !isNaN(Number(r[h])) && r[h] !== ''))
}
function getCatCols(rows: Record<string, unknown>[], headers: string[]): string[] {
  return headers.filter(h => rows.slice(0,20).some(r => isNaN(Number(r[h])) && r[h] !== ''))
}
function fmt(n: number) {
  if (n >= 1_000_000) return (n/1_000_000).toFixed(1)+'M'
  if (n >= 1_000) return (n/1_000).toFixed(1)+'K'
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

const tooltipStyle = {
  contentStyle: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text)' },
}

export default function ComparePage() {
  const { data: allDatasets } = useSWR('/api/datasets', fetcher, { revalidateOnFocus: false })

  const [datasetA, setDatasetA] = useState<string>('')
  const [datasetB, setDatasetB] = useState<string>('')

  // Fetch both datasets
  const { data: dsA } = useSWR(datasetA ? `/api/datasets/${datasetA}` : null, fetcher)
  const { data: dsB } = useSWR(datasetB ? `/api/datasets/${datasetB}` : null, fetcher)

  const rowsA = useMemo(() => dsA?.rows ?? [], [dsA])
  const rowsB = useMemo(() => dsB?.rows ?? [], [dsB])
  const headersA = useMemo(() => dsA?.headers ?? [], [dsA])
  const headersB = useMemo(() => dsB?.headers ?? [], [dsB])

  // Find common columns between both datasets
  const commonCols = useMemo(() =>
    headersA.filter((h: string) => headersB.includes(h)),
    [headersA, headersB]
  )
  const commonNumCols = useMemo(() => getNumericCols(rowsA, commonCols), [rowsA, commonCols])
  const commonCatCols = useMemo(() => getCatCols(rowsA, commonCols), [rowsA, commonCols])

  const [xCol, setXCol] = useState('')
  const [yCol, setYCol] = useState('')

  // Auto-set cols when common cols found
  useEffect(() => {
    if (commonCatCols[0]) setXCol(commonCatCols[0])
    if (commonNumCols[0]) setYCol(commonNumCols[0])
  }, [commonCatCols, commonNumCols])

  // Build chart data for both
  const chartA = useMemo(() => {
    if (!xCol || !yCol || rowsA.length === 0) return []
    return prepareChartData(rowsA, headersA, xCol, yCol, 'sum')
  }, [rowsA, headersA, xCol, yCol])

  const chartB = useMemo(() => {
    if (!xCol || !yCol || rowsB.length === 0) return []
    return prepareChartData(rowsB, headersB, xCol, yCol, 'sum')
  }, [rowsB, headersB, xCol, yCol])

  // Merge data for overlaid chart
  const mergedData = useMemo(() => {
    const allNames = Array.from(new Set([...chartA.map(d => d.name), ...chartB.map(d => d.name)]))
    return allNames.map(name => ({
      name,
      [dsA?.name ?? 'Dataset A']: chartA.find(d => d.name === name)?.value ?? 0,
      [dsB?.name ?? 'Dataset B']: chartB.find(d => d.name === name)?.value ?? 0,
    }))
  }, [chartA, chartB, dsA, dsB])

  // KPI comparison
  const kpiA = useMemo(() => ({
    total: rowsA.length,
    sum: chartA.reduce((a, b) => a + b.value, 0),
    avg: chartA.reduce((a, b) => a + b.value, 0) / (chartA.length || 1),
    categories: chartA.length,
  }), [rowsA, chartA])

  const kpiB = useMemo(() => ({
    total: rowsB.length,
    sum: chartB.reduce((a, b) => a + b.value, 0),
    avg: chartB.reduce((a, b) => a + b.value, 0) / (chartB.length || 1),
    categories: chartB.length,
  }), [rowsB, chartB])

  const datasetOptions = useMemo(() =>
    (allDatasets ?? []).map((ds: { _id: string; name: string }) => ds.name),
    [allDatasets]
  )
  const getIdByName = (name: string) =>
    allDatasets?.find((ds: { _id: string; name: string }) => ds.name === name)?._id ?? ''

  const DiffBadge = ({ a, b }: { a: number; b: number }) => {
    if (a === 0 && b === 0) return <span className="text-text-muted text-xs">—</span>
    const diff = b - a
    const pct = a !== 0 ? ((diff / Math.abs(a)) * 100).toFixed(1) : '∞'
    const positive = diff >= 0
    return (
      <span className={`flex items-center gap-0.5 text-xs font-mono font-medium ${positive ? 'text-success' : 'text-danger'}`}>
        {positive ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
        {Math.abs(Number(pct))}%
      </span>
    )
  }

  return (
    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.22 }} className="p-5 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-text flex items-center gap-2">
          <GitCompare size={20} className="text-accent" />
          Comparison Mode
        </h1>
        <p className="text-text-muted text-sm mt-0.5">Compare two datasets side by side</p>
      </div>

      {/* Dataset selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-bg-card border-2 border-accent/40 rounded-xl p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-accent mb-2">Dataset A</p>
          <SimpleDropdown
            label="Select dataset A"
            options={datasetOptions}
            value={dsA?.name ?? ''}
            onChange={(name) => setDatasetA(getIdByName(name))}
            className="w-full"
          />
          {dsA && <p className="text-xs text-text-muted mt-2">{rowsA.length} rows · {headersA.length} columns</p>}
        </div>
        <div className="bg-bg-card border-2 border-cyan/40 rounded-xl p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-cyan mb-2">Dataset B</p>
          <SimpleDropdown
            label="Select dataset B"
            options={datasetOptions}
            value={dsB?.name ?? ''}
            onChange={(name) => setDatasetB(getIdByName(name))}
            className="w-full"
          />
          {dsB && <p className="text-xs text-text-muted mt-2">{rowsB.length} rows · {headersB.length} columns</p>}
        </div>
      </div>

      {/* No data yet */}
      {(!dsA || !dsB) && (
        <div className="bg-bg-card border border-border border-dashed rounded-xl p-12 text-center">
          <GitCompare size={40} className="text-text-muted mx-auto mb-4 opacity-40" />
          <p className="text-text-muted text-sm">Select two datasets above to begin comparison</p>
        </div>
      )}

      {/* Comparison content */}
      {dsA && dsB && (
        <>
          {/* Column selectors */}
          {commonCols.length > 0 && (
            <div className="bg-bg-card border border-border rounded-xl p-4 flex flex-wrap gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Group By</label>
                <SimpleDropdown label="X Axis" options={commonCatCols.length > 0 ? commonCatCols : commonCols} value={xCol} onChange={setXCol} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Measure</label>
                <SimpleDropdown label="Y Axis" options={commonNumCols.length > 0 ? commonNumCols : commonCols} value={yCol} onChange={setYCol} />
              </div>
            </div>
          )}

          {commonCols.length === 0 && (
            <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 text-sm text-warning">
              These datasets have no columns in common. Comparison charts require at least one shared column.
            </div>
          )}

          {/* KPI comparison table */}
          <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold text-text">Key Metrics Comparison</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-bg-hover">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-mono text-text-muted uppercase">Metric</th>
                    <th className="px-4 py-2 text-right text-xs font-mono text-accent uppercase">{dsA.name}</th>
                    <th className="px-4 py-2 text-right text-xs font-mono text-cyan uppercase">{dsB.name}</th>
                    <th className="px-4 py-2 text-right text-xs font-mono text-text-muted uppercase">Difference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { label: 'Total Records', a: kpiA.total, b: kpiB.total },
                    { label: `Total ${yCol}`, a: kpiA.sum, b: kpiB.sum },
                    { label: `Average ${yCol}`, a: kpiA.avg, b: kpiB.avg },
                    { label: `${xCol} Categories`, a: kpiA.categories, b: kpiB.categories },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-bg-hover transition-colors">
                      <td className="px-4 py-3 text-text-muted text-sm">{row.label}</td>
                      <td className="px-4 py-3 text-right font-mono text-accent">{fmt(row.a)}</td>
                      <td className="px-4 py-3 text-right font-mono text-cyan">{fmt(row.b)}</td>
                      <td className="px-4 py-3 text-right"><DiffBadge a={row.a} b={row.b} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Overlaid grouped bar chart */}
          {mergedData.length > 0 && (
            <div className="bg-bg-card border border-border rounded-xl p-5">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <h3 className="text-sm font-semibold text-text mb-4">{yCol} by {xCol} — Side by Side</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={mergedData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }} />
                  <Bar dataKey={dsA.name} fill="#6366F1" radius={[4,4,0,0]} isAnimationActive animationDuration={700} />
                  <Bar dataKey={dsB.name} fill="#22D3EE" radius={[4,4,0,0]} isAnimationActive animationDuration={700} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Line chart overlay */}
          {mergedData.length > 0 && (
            <div className="bg-bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-text mb-4">{yCol} Trend Comparison</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={mergedData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }} />
                  <Line type="monotone" dataKey={dsA.name} stroke="#6366F1" strokeWidth={2} dot={{ r: 3 }} isAnimationActive animationDuration={700} />
                  <Line type="monotone" dataKey={dsB.name} stroke="#22D3EE" strokeWidth={2} dot={{ r: 3 }} isAnimationActive animationDuration={700} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}
